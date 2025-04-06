import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { workoutsApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  Edit2, 
  Trash, 
  Plus, 
  X, 
  Save,
  Clock,
  BarChart,
  ArrowUpRight,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ExerciseVolumeChart from "@/components/ExerciseVolumeChart";
import CopyWorkoutDialog from "@/components/CopyWorkoutDialog";

interface Set {
  reps: number;
  weight: number;
  completed: boolean;
}

interface Exercise {
  id: string;
  exerciseTemplate: {
    id: string;
    name: string;
    muscleGroups?: Array<{ id: string; name: string }>;
  };
  sets: Set[];
}

interface Workout {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: Exercise[];
  notes?: string;
  pendingSync: boolean;
}

const WorkoutDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  const [isPendingSync, setIsPendingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch from API, no localStorage fallback
        const response = await workoutsApi.getById(id);
        console.log("Workout data from API:", response.data);
        
        // Make sure exercises array exists and is properly populated
        let workoutData = response.data;
        
        // Ensure the exercises array exists
        if (!workoutData.exercises) {
          workoutData.exercises = [];
        }
        
        // Ensure all exercises have their sets defined and completed flag set
        if (workoutData.exercises.length > 0) {
          workoutData.exercises.forEach((exercise: any) => {
            if (!exercise.sets) {
              exercise.sets = [];
            }
            
            // Make sure each set has a completed flag
            exercise.sets.forEach((set: any) => {
              if (set.completed === undefined) {
                set.completed = false;
              }
            });
          });
        }
        
        console.log("Processed workout data:", workoutData);
        
        setWorkout(workoutData);
        setEditedName(workoutData.name);
        setEditedNotes(workoutData.notes || "");
        setIsUsingLocalStorage(false);
        setIsPendingSync(false);
      } catch (error) {
        console.error("Error fetching workout:", error);
        setError("Failed to load workout details. The workout may not exist or the server is unavailable.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkout();
  }, [id]);
  
  const handleToggleExerciseSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return;
    
    const updatedWorkout = { ...workout };
    const currentSet = updatedWorkout.exercises[exerciseIndex].sets[setIndex];
    currentSet.completed = !currentSet.completed;
    
    setWorkout(updatedWorkout);
    
    // No longer update API or localStorage immediately - user will click save button
  };
  
  const handleDeleteExercise = async (exerciseIndex: number) => {
    if (!workout) return;
    
    const exerciseId = workout.exercises[exerciseIndex].id;
    const exerciseName = workout.exercises[exerciseIndex].exerciseTemplate.name;
    
    try {
      // First update UI
      const updatedWorkout = { ...workout };
      updatedWorkout.exercises = updatedWorkout.exercises.filter((_, i) => i !== exerciseIndex);
      setWorkout(updatedWorkout);
      
      // Update via API only
      await workoutsApi.removeExercise(workout.id, exerciseId);
      toast({
        title: "Success",
        description: `${exerciseName} removed from workout`,
      });
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      toast({
        title: "Error",
        description: "Failed to remove exercise",
        variant: "destructive",
      });
      
      // Fetch workout again to restore state
      try {
        const response = await workoutsApi.getById(workout.id);
        setWorkout(response.data);
      } catch (refreshError) {
        console.error("Failed to refresh workout data:", refreshError);
      }
    }
  };
  
  const handleUpdateExerciseSets = (exerciseIndex: number, sets: Set[]) => {
    if (!workout) return;
    
    const updatedWorkout = { ...workout };
    updatedWorkout.exercises[exerciseIndex].sets = sets;
    
    setWorkout(updatedWorkout);
    
    // Update via API only
    try {
      const exerciseId = workout.exercises[exerciseIndex].id;
      const updatedExercise = {
        exerciseTemplateId: workout.exercises[exerciseIndex].exerciseTemplate.id,
        sets: sets
      };
      
      workoutsApi.updateExercise(workout.id, exerciseId, updatedExercise)
        .then(() => {
          toast({
            title: "Success",
            description: "Exercise sets updated",
          });
        })
        .catch(error => {
          console.error("Failed to update exercise:", error);
          toast({
            title: "Error",
            description: "Failed to update exercise sets",
            variant: "destructive",
          });
        });
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    if (!workout) return;
    
    const currentExercise = workout.exercises[exerciseIndex];
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    
    // Create a new set with the same values as the last one
    const newSet: Set = {
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false
    };
    
    const newSets = [...currentExercise.sets, newSet];
    
    // Just update the UI state
    const updatedWorkout = { ...workout };
    updatedWorkout.exercises[exerciseIndex].sets = newSets;
    setWorkout(updatedWorkout);
  };
  
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout || workout.exercises[exerciseIndex].sets.length <= 1) return;
    
    const newSets = workout.exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    
    // Just update the UI state
    const updatedWorkout = { ...workout };
    updatedWorkout.exercises[exerciseIndex].sets = newSets;
    setWorkout(updatedWorkout);
  };
  
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: any) => {
    if (!workout) return;
    
    // Create a temporary copy of sets for displaying in the UI
    const newSets = [...workout.exercises[exerciseIndex].sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    
    // Update only the UI state without sending API requests
    const updatedWorkout = { ...workout };
    updatedWorkout.exercises[exerciseIndex].sets = newSets;
    setWorkout(updatedWorkout);
    
    // Wait for user to explicitly save changes by clicking checkmark or other UI element
  };
  
  const updateLocalWorkout = (updatedWorkout: Workout) => {
    try {
      const storedWorkouts = localStorage.getItem('muscle-metrics-workouts');
      if (storedWorkouts) {
        const workouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = workouts.map((w: Workout) => 
          w.id === updatedWorkout.id ? updatedWorkout : w
        );
        localStorage.setItem('muscle-metrics-workouts', JSON.stringify(updatedWorkouts));
      }
    } catch (error) {
      console.error("Failed to update local workout:", error);
      toast({
        title: "Error",
        description: "Failed to save changes locally",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveChanges = async () => {
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      name: editedName,
      notes: editedNotes,
      date: workout.date
    };
    
    try {
      // Update via API only
      await workoutsApi.update(workout.id, {
        name: editedName,
        notes: editedNotes,
        date: workout.date
      });
      
      setWorkout(updatedWorkout);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Workout updated successfully",
      });
    } catch (error) {
      console.error("Failed to update workout:", error);
      toast({
        title: "Error",
        description: "Failed to update workout",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteWorkout = async () => {
    if (!workout) return;
    
    try {
      // Delete via API only
      await workoutsApi.delete(workout.id);
      
      toast({
        title: "Success",
        description: "Workout deleted successfully",
      });
      
      navigate('/workouts');
    } catch (error) {
      console.error("Failed to delete workout:", error);
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscle-accent"></div>
      </div>
    );
  }
  
  if (error || !workout) {
    return (
      <div className="p-4">
        <Link to="/workouts" className="mb-4 inline-block">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workouts
          </Button>
        </Link>
        
        <Card className="card-gradient p-6 rounded-xl text-center">
          <p className="text-red-400 mb-4">{error || "Workout not found"}</p>
          <Button 
            className="bg-muscle-primary"
            onClick={() => navigate('/workouts')}
          >
            Go Back to Workouts
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center mb-6">
        <Link to="/workouts" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        
        {!isEditing ? (
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-2">{workout.name}</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(workout.date)}
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-lg font-semibold bg-card mb-2"
              placeholder="Workout name"
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCopyDialogOpen(true)}
              >
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsEditing(true)}
                className="ml-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive"
                size="icon"
                onClick={() => setIsDeleting(true)}
                className="ml-2"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="bg-muscle-primary"
                onClick={handleSaveChanges}
              >
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditedName(workout.name);
                  setEditedNotes(workout.notes || "");
                }}
                className="ml-2"
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isUsingLocalStorage && (
        <Card className={`card-gradient p-3 rounded-xl mb-5 ${isPendingSync ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <div className="flex items-center">
            <Calendar className={`h-5 w-5 ${isPendingSync ? 'text-amber-400' : 'text-green-400'} mr-2`} />
            <div>
              <p className={`text-sm ${isPendingSync ? 'text-amber-300' : 'text-green-300'}`}>
                <span className="font-medium">{isPendingSync ? 'Local Mode' : 'Synced Mode'}:</span> 
                {isPendingSync 
                  ? ' This workout is currently only stored in your browser.' 
                  : ' This workout is saved locally and synced with the database.'}
              </p>
              {isPendingSync && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-amber-400 hover:text-amber-300"
                  onClick={syncWorkoutToDatabase}
                  disabled={isSyncing}
                >
                  Click to save to database
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          {workout.targetMuscleGroups.map((group) => (
            <Badge 
              key={group.id}
              className="bg-muscle-primary/20 text-muscle-accent"
            >
              {group.name}
            </Badge>
          ))}
        </div>
        
        {!isEditing ? (
          workout.notes ? (
            <Card className="card-gradient p-4 rounded-xl">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {workout.notes}
              </p>
            </Card>
          ) : null
        ) : (
          <div className="mt-4">
            <label className="text-sm font-medium block mb-2">Notes</label>
            <Textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add notes about this workout..."
              className="bg-card min-h-[100px]"
            />
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Exercises ({workout.exercises.length})</h2>
          <Link to={`/workouts/${workout.id}/add-exercise`}>
            <Button className="bg-muscle-primary">
              <Plus className="h-4 w-4 mr-1" /> Add Exercise
            </Button>
          </Link>
        </div>
        
        {workout.exercises.length === 0 ? (
          <Card className="card-gradient p-6 rounded-xl text-center">
            <p className="text-muted-foreground mb-4">
              No exercises added to this workout yet
            </p>
            <Link to={`/workouts/${workout.id}/add-exercise`}>
              <Button className="bg-muscle-primary">
                <Plus className="h-4 w-4 mr-1" /> Add Your First Exercise
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIndex) => (
              <Card key={exercise.id} className="card-gradient p-4 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{exercise.exerciseTemplate.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exercise.exerciseTemplate.muscleGroups?.map((group) => (
                        <Badge 
                          key={group.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center">
                      <BarChart className="h-3 w-3 mr-1" />
                      Volume: {exercise.sets.reduce((total, set) => total + (set.reps * set.weight), 0).toFixed(1)} kg
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddSet(exerciseIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Set
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/20"
                      onClick={() => handleUpdateExerciseSets(exerciseIndex, workout.exercises[exerciseIndex].sets)}
                    >
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/20"
                      onClick={() => handleDeleteExercise(exerciseIndex)}
                    >
                      <Trash className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                
                {/* Collapsible Volume History Chart */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-muscle-accent hover:text-muscle-accent/80 mb-2">
                    Show Volume History
                  </summary>
                  <div className="pt-2">
                    <ExerciseVolumeChart 
                      exerciseTemplateId={exercise.exerciseTemplate.id}
                      exerciseName={exercise.exerciseTemplate.name}
                    />
                  </div>
                </details>
                
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div 
                      key={setIndex} 
                      className={`
                        flex items-center justify-between p-3 rounded-md transition-colors
                        ${set.completed 
                          ? 'bg-muscle-primary/20 border border-muscle-primary/30' 
                          : 'bg-muscle-dark/30 border border-border'}
                      `}
                    >
                      <div className="flex items-center">
                        <div 
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center mr-3
                            ${set.completed 
                              ? 'bg-muscle-primary text-white' 
                              : 'bg-card text-muted-foreground border border-border'}
                          `}
                          onClick={() => handleToggleExerciseSet(exerciseIndex, setIndex)}
                        >
                          {setIndex + 1}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <div className="mb-1 sm:mb-0">
                            <label className="text-xs text-muted-foreground block">Reps</label>
                            <Input
                              type="number"
                              min="1"
                              value={set.reps === 0 ? '' : set.reps}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^0+/, '');
                                handleUpdateSet(exerciseIndex, setIndex, 'reps', parseInt(value) || 0);
                              }}
                              className="w-20 h-7 bg-muscle-dark/50 px-2"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block">Weight (kg)</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weight === 0 ? '0' : set.weight}
                              onChange={(e) => {
                                const value = e.target.value.replace(/^0+(?!\.)/, '');
                                handleUpdateSet(exerciseIndex, setIndex, 'weight', parseFloat(value) || 0);
                              }}
                              className="w-20 h-7 bg-muscle-dark/50 px-2"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div 
                          className={`
                            w-5 h-5 rounded border flex items-center justify-center mr-2
                            ${set.completed 
                              ? 'bg-muscle-primary border-muscle-primary' 
                              : 'bg-transparent border-border'}
                          `}
                          onClick={() => handleToggleExerciseSet(exerciseIndex, setIndex)}
                        >
                          {set.completed && (
                            <svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 12 12" 
                              fill="none" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                d="M10 3L4.5 8.5L2 6" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        
                        {exercise.sets.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Copy Workout Dialog */}
      {workout && (
        <CopyWorkoutDialog
          workoutId={workout.id}
          workoutName={workout.name}
          isOpen={isCopyDialogOpen}
          onClose={() => setIsCopyDialogOpen(false)}
        />
      )}
      
      {/* Delete Workout Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWorkout}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkoutDetails; 