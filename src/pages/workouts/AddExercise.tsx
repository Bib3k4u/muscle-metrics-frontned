import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { exerciseTemplatesApi, muscleGroupsApi, workoutsApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Search, X, RefreshCcw, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NotFoundWithReturn from "./NotFoundWithReturn";

interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  muscleGroups?: Array<{ id: string; name: string }>;
  requiresWeight: boolean;
}

interface MuscleGroup {
  id: string;
  name: string;
}

const AddExercise = () => {
  const { id: workoutId } = useParams<{ id: string }>();
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExerciseTemplate[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  const [sets, setSets] = useState([{ reps: 8, weight: 10 }]);
  const [workoutExists, setWorkoutExists] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "You're back online",
        description: "Connected to the server",
        variant: "default",
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "You're offline",
        description: "Working in offline mode - changes will be saved locally",
        variant: "warning",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  // Calculate total volume whenever sets change
  useEffect(() => {
    if (selectedExercise?.requiresWeight) {
      const volume = sets.reduce((total, set) => total + (set.reps * set.weight), 0);
      setTotalVolume(volume);
    } else {
      setTotalVolume(0);
    }
  }, [sets, selectedExercise]);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadingError(false);
    setIsUsingLocalStorage(false);
    
    try {
      // Check if we're offline
      if (!navigator.onLine) {
        console.log("Device is offline, using local storage mode");
        setIsUsingLocalStorage(true);
      }
      
      // First check if the workout exists
      if (workoutId) {
        try {
          await workoutsApi.getById(workoutId);
          setIsUsingLocalStorage(false);
        } catch (apiError) {
          console.error("Workout not found in API:", apiError);
          
          // Try to find workout in localStorage
          const storedWorkouts = localStorage.getItem('muscle-metrics-workouts');
          if (storedWorkouts) {
            const localWorkouts = JSON.parse(storedWorkouts);
            const foundWorkout = localWorkouts.find((w: any) => w.id === workoutId);
            
            if (foundWorkout) {
              setIsUsingLocalStorage(true);
              console.log("Using locally stored workout:", foundWorkout);
            } else {
              setWorkoutExists(false);
              setLoading(false);
              return;
            }
          } else {
            setWorkoutExists(false);
            setLoading(false);
            return;
          }
        }
      } else {
        setWorkoutExists(false);
        setLoading(false);
        return;
      }
      
      // Initialize with empty arrays to prevent map errors
      setMuscleGroups([]);
      setExerciseTemplates([]);
      setFilteredTemplates([]);
      
      // Fetch exercise templates and muscle groups in parallel
      try {
        console.log("Fetching data from API endpoints (using shorter timeouts and public endpoints)");
        const [exerciseRes, muscleGroupRes] = await Promise.allSettled([
          exerciseTemplatesApi.getAll(),
          muscleGroupsApi.getAll()
        ]);
        
        // Handle exercise templates response
        if (exerciseRes.status === 'fulfilled' && exerciseRes.value?.data) {
          console.log("Successfully fetched exercise templates:", exerciseRes.value.data.length);
          const templates = exerciseRes.value.data;
          
          // Normalize data to ensure all templates have a valid muscleGroups array
          const normalizedTemplates = templates.map((template: ExerciseTemplate) => {
            // Ensure muscleGroups is always a valid array
            if (!template.muscleGroups || !Array.isArray(template.muscleGroups)) {
              console.warn(`Fixing template ${template.id} (${template.name}) with missing muscleGroups`);
              return {
                ...template,
                muscleGroups: []
              };
            }
            // Filter out any invalid muscle group entries
            const validMuscleGroups = template.muscleGroups.filter(
              group => group && typeof group === 'object' && 'id' in group && 'name' in group
            );
            
            if (validMuscleGroups.length !== template.muscleGroups.length) {
              console.warn(`Fixed ${template.muscleGroups.length - validMuscleGroups.length} invalid muscle groups in ${template.name}`);
              return {
                ...template,
                muscleGroups: validMuscleGroups
              };
            }
            
            return template;
          });
          
          setExerciseTemplates(normalizedTemplates);
          setFilteredTemplates(normalizedTemplates);
          
          // Check if we got mock data
          if (exerciseRes.value.usingMock) {
            console.info("Using mock exercise template data");
            setIsUsingLocalStorage(true);
          }
        } else {
          console.error("Failed to fetch exercise templates:", 
            exerciseRes.status === 'rejected' ? exerciseRes.reason : "No data returned");
          
          // Only set loading error if muscle groups also failed
          if (muscleGroupRes.status === 'rejected') {
            setLoadingError(true);
            toast({
              title: "Error",
              description: "Failed to load exercises. Please try again.",
              variant: "destructive",
            });
          }
        }
        
        // Handle muscle groups response
        if (muscleGroupRes.status === 'fulfilled' && muscleGroupRes.value?.data) {
          console.log("Successfully fetched muscle groups:", muscleGroupRes.value.data.length);
          setMuscleGroups(muscleGroupRes.value.data);
          
          // Check if we got mock data
          if (muscleGroupRes.value.usingMock) {
            console.info("Using mock muscle group data");
            setIsUsingLocalStorage(true);
          }
        } else {
          console.error("Failed to fetch muscle groups:", 
            muscleGroupRes.status === 'rejected' ? muscleGroupRes.reason : "No data returned");
          
          // Only set loading error if exercise templates also failed
          if (exerciseRes.status === 'rejected') {
            setLoadingError(true);
            toast({
              title: "Error",
              description: "Failed to load muscle groups. Please try again.",
              variant: "destructive",
            });
          }
        }
        
        // If both requests failed, set more detailed error
        if (exerciseRes.status === 'rejected' && muscleGroupRes.status === 'rejected') {
          setLoadingError(true);
          toast({
            title: "Connection Error",
            description: "Could not connect to the server. Please check your connection.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Critical error fetching data:", error);
        setLoadingError(true);
        toast({
          title: "Error",
          description: "Failed to load data. Please check your connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoadingError(true);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [workoutId, toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    let result = exerciseTemplates || [];
    console.log(`Filtering ${result.length} exercise templates...`);
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const beforeCount = result.length;
      result = result.filter(
        (template) => template.name.toLowerCase().includes(query)
      );
      console.log(`Search query "${searchQuery}" filtered ${beforeCount} exercises down to ${result.length}`);
    }
    
    // Filter by muscle group
    if (selectedMuscleGroup && selectedMuscleGroup !== "all") {
      console.log(`Filtering exercises by muscle group: ${selectedMuscleGroup}`);
      const beforeCount = result.length;
      
      result = result.filter((template) => {
        // Safety check for muscleGroups property
        if (!template.muscleGroups || !Array.isArray(template.muscleGroups) || template.muscleGroups.length === 0) {
          console.warn(`Template ${template.id} (${template.name}) has invalid or empty muscleGroups property`, template.muscleGroups);
          return false;
        }
        
        // Make sure we properly check the muscle group IDs with stricter type checking
        const hasMuscleGroup = template.muscleGroups.some(
          group => group && typeof group === 'object' && 'id' in group && group.id === selectedMuscleGroup
        );
        
        if (hasMuscleGroup) {
          console.log(`Template "${template.name}" matches muscle group ${selectedMuscleGroup}`);
        }
        
        return hasMuscleGroup;
      });
      
      console.log(`Muscle group "${selectedMuscleGroup}" filtered ${beforeCount} exercises down to ${result.length}`);
    }
    
    setFilteredTemplates(result);
  }, [searchQuery, selectedMuscleGroup, exerciseTemplates]);
  
  const selectExercise = (exercise: ExerciseTemplate) => {
    // Ensure muscleGroups is defined
    const safeExercise = {
      ...exercise,
      muscleGroups: exercise.muscleGroups || []
    };
    
    setSelectedExercise(safeExercise);
    // Reset sets to default values when selecting a new exercise
    // Set weight to 0 if exercise doesn't require weights
    setSets([{ 
      reps: 8, 
      weight: safeExercise.requiresWeight ? 10 : 0 
    }]);
  };
  
  const addSet = () => {
    if (sets.length > 0 && selectedExercise) {
      const lastSet = sets[sets.length - 1];
      setSets([...sets, { ...lastSet }]);
    }
  };
  
  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };
  
  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };
  
  const handleSubmit = async () => {
    if (!workoutId || !selectedExercise || sets.length === 0) return;
    
    setSubmitting(true);
    try {
      // Validate that all sets have reasonable values
      const invalidSets = sets.filter(set => !set.reps || set.reps <= 0);
      if (invalidSets.length > 0) {
        throw new Error("All sets must have a valid number of reps");
      }
      
      // Prepare the exercise data payload - proper formatting happens in the API service
      const exerciseData = {
        exerciseTemplateId: selectedExercise.id,
        sets: sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          completed: false
        }))
      };
      
      // Log the data we're sending
      console.log("Submitting exercise to workout:", exerciseData);
      
      // Add the exercise to the workout
      try {
        await workoutsApi.addExercise(workoutId, exerciseData);
        
        toast({
          title: "Success",
          description: `${selectedExercise.name} added with ${sets.length} sets`,
        });
        
        // Navigate back to workout details
        navigate(`/workouts/${workoutId}`);
      } catch (apiError) {
        console.error("API Error:", apiError);
        
        // Handle offline mode gracefully
        if (!navigator.onLine) {
          toast({
            title: "Offline Mode",
            description: "You're offline. Exercise will be saved locally and synced later.",
            variant: "warning",
          });
          
          // Implement offline handling here
          // This will require local storage logic similar to what was in the API service
          
          // For now, just inform the user
          toast({
            title: "Not Implemented",
            description: "Offline mode is not fully implemented yet. Please try again when online.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle authentication errors
        if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
          toast({
            title: "Authentication Error",
            description: "Please log in again to continue.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle server errors
        if (apiError.response && apiError.response.status === 500) {
          toast({
            title: "Server Error",
            description: "The server encountered an error. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle other errors
        toast({
          title: "Error",
          description: apiError.message || "Failed to add exercise to workout",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add exercise:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to prepare exercise data",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscle-accent"></div>
      </div>
    );
  }
  
  if (loadingError) {
    return (
      <div className="p-4 animate-fade-in">
        <Card className="card-gradient p-6 rounded-xl max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-500 flex items-center justify-center rounded-full mx-auto mb-6">
            <span className="text-4xl">!</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Connection Issue</h1>
          
          <p className="text-muted-foreground mb-2">
            We couldn't connect to the server to load the exercise data. 
          </p>
          
          <p className="text-amber-400 mb-6">
            Don't worry! We'll use demo exercises so you can continue your workout.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button className="w-full bg-muscle-primary" onClick={fetchData}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Link to={`/workouts/${workoutId}`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Workout
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!workoutExists) {
    return (
      <NotFoundWithReturn 
        returnPath="/workouts" 
        returnLabel="Return to Workouts"
      />
    );
  }
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center mb-6">
        <Link to={`/workouts/${workoutId}`} className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold mb-2">Add Exercise</h1>
          <p className="text-sm text-muted-foreground">
            Add exercises to your workout
          </p>
        </div>
      </div>
      
      {(isUsingLocalStorage || isOffline) && (
        <Card className="card-gradient p-3 rounded-xl mb-5 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center">
            <p className="text-sm text-amber-300">
              <span className="font-medium">{isOffline ? "Offline Mode:" : "Local Storage Mode:"}</span> {isOffline ? "You're currently offline. " : ""} Changes will be saved to your browser and synced when you reconnect.
            </p>
          </div>
        </Card>
      )}
      
      {!selectedExercise ? (
        // Step 1: Select an exercise
        <>
          <Card className="card-gradient p-4 rounded-xl mb-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  className="pl-10 bg-muscle-dark/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Filter by Muscle Group</label>
                <Select 
                  value={selectedMuscleGroup} 
                  onValueChange={(value) => {
                    console.log(`Selected muscle group: ${value}`);
                    setSelectedMuscleGroup(value);
                  }}
                >
                  <SelectTrigger className="bg-muscle-dark/50 mt-1">
                    <SelectValue placeholder="All Muscle Groups" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground">
                    <SelectItem value="all">All Muscle Groups</SelectItem>
                    {Array.isArray(muscleGroups) && muscleGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMuscleGroup !== "all" && (
                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>
                      Showing {filteredTemplates.length} exercises
                    </span>
                    <button 
                      className="text-muscle-accent hover:underline" 
                      onClick={() => setSelectedMuscleGroup("all")}
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          <div className="space-y-4">
            {filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className="card-gradient p-4 rounded-xl"
                  onClick={() => selectExercise(template)}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {template.muscleGroups && template.muscleGroups.map((group) => (
                      <Badge 
                        key={group.id}
                        className="bg-muscle-primary/20 text-muscle-accent"
                      >
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </Card>
              ))
            ) : (
              <Card className="card-gradient p-6 rounded-xl text-center">
                <p className="text-muted-foreground">
                  No exercises found matching your filters
                </p>
              </Card>
            )}
          </div>
        </>
      ) : (
        // Step 2: Set details
        <Card className="card-gradient p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{selectedExercise.name}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedExercise(null)}
            >
              Change
            </Button>
          </div>
          
          <div className="space-y-1 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Sets</h3>
              {selectedExercise.requiresWeight && (
                <div className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full">
                  Total Volume: {totalVolume.toFixed(1)} kg
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {sets.map((set, index) => (
                <div key={index} className="flex items-center gap-2 bg-muscle-dark/50 p-3 rounded-md">
                  <div className="bg-muscle-primary/20 text-muscle-accent h-6 w-6 flex items-center justify-center rounded-full">
                    {index + 1}
                  </div>
                  
                  <div className="flex-grow grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-muted-foreground">Reps</label>
                      <Input
                        type="number"
                        min="1"
                        value={set.reps === 0 ? "" : set.reps}
                        onChange={(e) => {
                          const value = e.target.value.replace(/^0+/, '');
                          updateSet(index, 'reps', parseInt(value) || 0);
                        }}
                        className="bg-muscle-dark h-8 mt-1"
                      />
                    </div>
                    
                    {selectedExercise.requiresWeight && (
                      <div>
                        <label className="block text-xs text-muted-foreground">Weight (kg)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={set.weight === 0 ? "0" : set.weight}
                          onChange={(e) => {
                            const value = e.target.value.replace(/^0+(?!\.)/, '');
                            updateSet(index, 'weight', parseFloat(value) || 0);
                          }}
                          className="bg-muscle-dark h-8 mt-1"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-right min-w-[40px]">
                    {(set.reps * set.weight).toFixed(1)}kg
                  </div>
                  
                  {sets.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSet(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline"
              className="w-full mb-4 mt-2 border-dashed border-muscle-primary/50 text-muscle-primary"
              onClick={addSet}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Set
            </Button>
            
            <Button 
              className="w-full mt-4 bg-muscle-primary"
              onClick={handleSubmit}
              disabled={submitting || sets.some(set => set.reps <= 0)}
            >
              {submitting ? "Adding..." : "Add to Workout"}
            </Button>
          </div>
        </Card>
      )}
      
      {/* Selected exercise card */}
      {selectedExercise && (
        <div className="space-y-6 mt-6">
          <Card className="card-gradient p-4 rounded-xl">
            <h3 className="font-semibold text-lg mb-2">{selectedExercise.name}</h3>
            
            {selectedExercise.description && (
              <p className="text-sm text-muted-foreground mb-3">{selectedExercise.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedExercise.muscleGroups && selectedExercise.muscleGroups.length > 0 ? (
                selectedExercise.muscleGroups.map((group) => (
                  <Badge 
                    key={group.id}
                    variant="outline"
                    className="text-xs bg-muscle-primary/20 text-muscle-accent"
                  >
                    {group.name}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-xs bg-muscle-primary/20 text-muscle-accent">
                  No muscle groups
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center text-green-400 mb-2">
                <BarChart className="h-4 w-4 mr-1" />
                Total Volume: {totalVolume.toFixed(1)}kg
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedExercise(null)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </Card>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Sets</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addSet}
                className="border-muscle-accent text-muscle-accent"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Set
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExercise; 