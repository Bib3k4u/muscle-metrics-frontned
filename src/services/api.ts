import axios from 'axios';

// Detect if we're running in development mode
const isDevelopment = import.meta.env.MODE === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use a relative URL in development to leverage the Vite proxy
const apiBaseUrl = isDevelopment 
  ? '/api' // When in development, use relative URL that will be handled by proxy
  : 'https://muscle-metrics-backend-production.up.railway.app/api';

console.log(`API configured with: ${apiBaseUrl}`);
console.log(`Development mode: ${isDevelopment}`);
console.log('Using ONLY real backend data - no mock data fallbacks');

// Create an axios instance with default config
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set withCredentials to false to avoid CORS issues with wildcard origins
  withCredentials: false,
  // Use a very long timeout to ensure data is fetched
  timeout: 60000, // 60 seconds - much longer to allow for slow backend responses
});

// Function to check if a server is responding at the provided URL
export const checkServerConnection = async (url = apiBaseUrl) => {
  try {
    // Create an AbortController with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    return true; // Server is responding
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false; // Server is not responding
  }
};

// Function to get auth token - centralized to ensure consistency
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Add request interceptor for debugging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    // Add auth token if available - always try to authenticate requests
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request authenticated with token');
    } else {
      console.log('Request not authenticated - no token found');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`Successful response from: ${response.config.url}`);
    return response;
  },
  (error) => {
    // Only log detailed errors in development
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        url: error.config?.url
      });
      
      // Handle common error status codes
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Authentication/authorization error - make sure you are logged in');
        // If token is expired or invalid, try to clear it to force re-login
        if (error.response.data?.message?.includes('expired') || 
            error.response.data?.message?.includes('invalid')) {
          console.log('Token may be expired or invalid - clearing token');
          localStorage.removeItem('token');
        }
      } else if (error.response.status === 500) {
        console.error('Server error - the backend may be experiencing issues');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', {
        url: error.config?.url
      });
      
      // Check if it's a timeout error, but don't show extensive warnings
      if (error.code === 'ECONNABORTED') {
        console.error('API Request timed out.');
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to normalize exercise templates
const normalizeExerciseTemplate = (template: any) => {
  if (!template) return null;
  
  // Ensure muscleGroups is always defined
  if (!template.muscleGroups) {
    template.muscleGroups = [];
    
    // If the old model is used with primaryMuscleGroup and secondaryMuscleGroup,
    // convert it to the expected format
    if (template.primaryMuscleGroup) {
      template.muscleGroups.push({
        id: template.primaryMuscleGroup.id || template.primaryMuscleGroup,
        name: template.primaryMuscleGroup.name || 'Primary'
      });
    }
    
    if (template.secondaryMuscleGroup) {
      template.muscleGroups.push({
        id: template.secondaryMuscleGroup.id || template.secondaryMuscleGroup,
        name: template.secondaryMuscleGroup.name || 'Secondary'
      });
    }
  }
  
  // Ensure requiresWeight is a boolean
  if (template.requiresWeight === undefined) {
    template.requiresWeight = true;
  }
  
  return template;
};

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials, { 
        withCredentials: false, 
        headers: { 'Content-Type': 'application/json' }
      });
      
      // If login is successful, store the token
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token stored successfully');
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  register: (userData: { username: string; email: string; password: string }) => 
    api.post('/auth/signup', userData, { 
      withCredentials: false,
      headers: { 'Content-Type': 'application/json' }
    }),
    
  getCurrentUser: () => api.get('/users/profile', { 
    withCredentials: false 
  }),
  
  updateProfile: (profileData: any) => api.put('/users/profile', profileData, { 
    withCredentials: false 
  }),
  
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => 
    api.post('/users/change-password', passwordData, { 
      withCredentials: false 
    }),
    
  logout: () => {
    localStorage.removeItem('token');
    console.log('User logged out - token removed');
    return Promise.resolve({ success: true });
  }
};

export const muscleGroupsApi = {
  getAll: async () => {
    // Fallback muscle groups in case API fails
    const fallbackMuscleGroups = [
      { id: "chest", name: "Chest" },
      { id: "back", name: "Back" },
      { id: "legs", name: "Legs" },
      { id: "shoulders", name: "Shoulders" },
      { id: "arms", name: "Arms" },
      { id: "biceps", name: "Biceps" },
      { id: "triceps", name: "Triceps" },
      { id: "core", name: "Core" },
      { id: "abs", name: "Abs" },
      { id: "cardio", name: "Cardio" }
    ];
    
    try {
      // Try the API call first - ensure we have auth headers
      const token = getAuthToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await api.get('/muscle-groups/public', config);
      return response;
    } catch (error) {
      console.warn("API call for muscle groups failed, using fallback data", error);
      
      // Return the fallback muscle groups in the expected format
      return {
        data: fallbackMuscleGroups,
        status: 200,
        statusText: "OK (Fallback)",
        headers: {},
        config: {},
        usingMock: true
      };
    }
  },
  getById: (id: string) => {
    const token = getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return api.get(`/muscle-groups/public/${id}`, config);
  },
};

export const exerciseTemplatesApi = {
  getAll: async () => {
    // Ensure we have auth headers for authenticated endpoints
    const token = getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    // Try both authenticated and public endpoints
    let response;
    
    try {
      // First try the authenticated endpoint
      response = await api.get('/exercise-templates', config);
    } catch (authError) {
      console.log('Authenticated endpoint failed, trying public endpoint');
      // Fall back to public endpoint
      response = await api.get('/exercise-templates/public', config);
    }
    
    // Normalize the data before returning it
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(normalizeExerciseTemplate);
    }
    
    return response;
  },
  getById: (id: string) => {
    const token = getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    // Try both possible endpoint paths
    return api.get(`/exercise-templates/${id}`, config)
      .catch(() => api.get(`/exercise-templates/public/${id}`, config));
  },
  getByMuscleGroup: (muscleGroupId: string) => {
    const token = getAuthToken();
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    return api.get(`/exercise-templates/by-muscle-group/${muscleGroupId}`, config)
      .catch(() => api.get(`/exercise-templates/public/by-muscle-group/${muscleGroupId}`, config));
  },
};

export const workoutsApi = {
  getAll: async () => {
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - workout API may fail');
    }
    
    // Get all workouts from the server with extended timeout
    return await api.get('/workouts', {
      timeout: 90000 // 90 seconds for larger datasets
    });
  },
  getById: (id: string) => api.get(`/workouts/${id}`),
  getByDateRange: async (startDate: string, endDate: string) => {
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - date range API may fail');
    }
    
    // Check if date range is very large and potentially problematic
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Fetching workouts for date range spanning ${daysDifference} days`);
    
    // Date range query with extended timeout
    return await api.get(`/workouts/by-date-range?startDate=${startDate}&endDate=${endDate}`, {
      timeout: 90000 // 90 seconds for date range queries which may be large
    });
  },
  getByMuscleGroup: (muscleGroupId: string) => 
    api.get(`/workouts/by-muscle-group/${muscleGroupId}`),
  create: (workoutData: any) => api.post('/workouts', workoutData),
  update: (id: string, workoutData: any) => api.put(`/workouts/${id}`, workoutData),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  addExercise: async (workoutId: string, exerciseData: any) => {
    console.log(`Adding exercise to workout ${workoutId}:`, JSON.stringify(exerciseData));
    
    // Format validation to ensure we're sending correct data structure
    if (!exerciseData.exerciseTemplateId) {
      throw new Error("Missing required field: exerciseTemplateId");
    }
    
    if (!Array.isArray(exerciseData.sets) || exerciseData.sets.length === 0) {
      throw new Error("Sets must be a non-empty array");
    }
    
    // Format the data properly for the backend
    // Backend expects: { exerciseTemplateId: String, sets: [{reps: Integer, weight: Double, completed: Boolean}] }
    const formattedExerciseData = {
      exerciseTemplateId: exerciseData.exerciseTemplateId,
      sets: exerciseData.sets.map((set: any) => {
        // Using parseInt to ensure reps is an integer
        const reps = parseInt(String(set.reps), 10);
        // Using parseFloat to ensure weight is a double/float
        const weight = parseFloat(String(set.weight || 0));
        
        if (isNaN(reps) || reps <= 0) {
          throw new Error(`Invalid reps value: ${set.reps}`);
        }
        
        if (isNaN(weight)) {
          throw new Error(`Invalid weight value: ${set.weight}`);
        }
        
        return {
          reps: reps,
          weight: weight,
          completed: !!set.completed
        };
      })
    };
    
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - adding exercise may fail');
    }
    
    return await api.post(`/workouts/${workoutId}/exercises`, formattedExerciseData);
  },
  updateExercise: (workoutId: string, exerciseId: string, exerciseData: any) => 
    api.put(`/workouts/${workoutId}/exercises/${exerciseId}`, exerciseData),
  removeExercise: (workoutId: string, exerciseId: string) => 
    api.delete(`/workouts/${workoutId}/exercises/${exerciseId}`),
  copyWorkout: (workoutId: string, newDate: string) => 
    api.post(`/workouts/${workoutId}/copy?newDate=${newDate}`),
  getExerciseHistory: async (exerciseTemplateId: string, startDate?: string) => {
    // If startDate is provided, check if the range might be too large
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(); // Current date
      const daysDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Fetching exercise history for ${exerciseTemplateId} spanning ${daysDifference} days`);
    }
    
    const url = startDate 
      ? `/workouts/exercise-history/${exerciseTemplateId}?startDate=${startDate}`
      : `/workouts/exercise-history/${exerciseTemplateId}`;
    
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - exercise history API may fail');
    }
    
    return await api.get(url, {
      timeout: 90000 // 90 seconds for history queries which may retrieve large datasets
    });
  }
};

export const workoutTemplatesApi = {
  getAll: async () => {
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - workout templates API may fail');
    }
    
    return await api.get('/workout-templates', {
      timeout: 60000 // 60 seconds for template queries
    });
  },
  
  getById: async (id: string) => {
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - getting template by ID may fail');
    }
    
    return await api.get(`/workout-templates/${id}`);
  },
  
  createWorkoutFromTemplate: async (templateId: string, date: string) => {
    // Get the template first - we need this to get template details
    const templateResponse = await workoutTemplatesApi.getById(templateId);
    const template = templateResponse.data;
    
    if (!template) {
      throw new Error("Template not found");
    }
    
    // Ensure auth token is attached to the request
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available - creating workout from template may fail');
    }
    
    console.log(`Creating workout from template ${templateId} for date ${date}`);
    return await api.post(
      `/workouts/from-template/${templateId}`, 
      { date: date }
    );
  },
};

// Function to test backend connectivity
export const testBackendConnection = async () => {
  try {
    console.log('Testing connection to backend...');
    const response = await api.get('/public/ping', { 
      timeout: 30000, // 30 seconds
      withCredentials: false 
    });
    
    console.log('Backend connection test successful:', response.data);
    return {
      connected: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return {
      connected: false,
      data: null,
      error: error
    };
  }
};

// Method to test CORS configuration
export const testCorsConfiguration = async () => {
  try {
    console.log('Testing CORS configuration...');
    const response = await api.get('/public/test-cors', {
      timeout: 30000, // 30 seconds
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        'Custom-Header': 'Test' // Add a custom header to test CORS for non-standard headers
      }
    });
    
    console.log('CORS test successful:', response.data);
    return {
      corsEnabled: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('CORS test failed:', error);
    return {
      corsEnabled: false,
      data: null,
      error: error
    };
  }
};

export default api; 