import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  weight?: number;
  height?: number;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>; // Changed from Promise<void> to Promise<any>
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authApi.login({ email, password });
      const { token: authToken, ...userData } = response.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      return userData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      toast({
        title: "Login failed",
        description: errorMsg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create the user data object as expected by the API
      const userData = { username, email, password };
      
      console.log("Sending registration data:", userData);
      
      // Call the register API with the correct data structure
      const response = await authApi.register(userData);
      
      console.log("Registration response:", response.data);
      
      // Extract relevant data from the response
      const { token: authToken, id, username: responseUsername, email: responseEmail, roles } = response.data;
      
      // Store the token in localStorage
      localStorage.setItem('token', authToken);
      setToken(authToken);
      
      // Set the user data in state
      const userObject = { 
        id, 
        username: responseUsername, 
        email: responseEmail, 
        roles 
      };
      setUser(userObject);
      
      toast({
        title: "Registration successful",
        description: `Welcome to MuscleMetrics, ${username}!`,
      });
      
      return userObject;
    } catch (err: any) {
      console.error("Registration error details:", err);
      
      let errorMsg = 'Registration failed. Please try again.';
      
      if (err.response) {
        console.error("Error response:", err.response.data);
        
        if (err.response.data && err.response.data.error) {
          // If the backend returns a specific error message
          errorMsg = err.response.data.error;
        } else if (err.response.status === 500) {
          // Most likely this is a CORS issue or server-side problem
          errorMsg = 'Server error occurred. Please try using a different email address.';
        } else {
          // For other error types, try to extract a meaningful message
          errorMsg = err.response.data?.message || err.response.statusText || errorMsg;
        }
      } else if (err.request) {
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        errorMsg = err.message || errorMsg;
      }
      
      setError(errorMsg);
      toast({
        title: "Registration failed",
        description: errorMsg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      const response = await authApi.updateProfile(profileData);
      setUser(response.data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile.';
      setError(errorMsg);
      toast({
        title: "Update failed",
        description: errorMsg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
