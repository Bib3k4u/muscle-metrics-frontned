
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { workoutsApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, Clock, Edit, Trash, Plus,
  Copy, ChevronDown, MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface WorkoutExercise {
  id: string;
  exerciseTemplate: {
    id: string;
    name: string;
    requiresWeight: boolean;
  };
  sets: Array<{
    reps: number;
    weight: number;
  }>;
  totalVolume: number;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: WorkoutExercise[];
  notes: string;
}

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        if (id) {
          const response = await workoutsApi.getById(id);
          setWorkout(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch workout:", error);
        toast({
          title: "Error",
          description: "Failed to load workout details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkout();
  }, [id, toast]);
  
  const handleDelete = async () => {
    try {
      if (id) {
        await workoutsApi.delete(id);
        toast({
          title: "Success",
          description: "Workout deleted successfully",
        });
        navigate("/workouts");
      }
    } catch (error) {
      console.error("Failed to delete workout:", error);
      toast({
        title: "Error",
        description: "Failed to delete workout",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };
  
  const handleCopy = async () => {
    try {
      if (id && newDate) {
        await workoutsApi.copyWorkout(id, newDate);
        toast({
          title: "Success",
          description: "Workout copied successfully",
        });
        navigate("/workouts");
      }
    } catch (error) {
      console.error("Failed to copy workout:", error);
      toast({
        title: "Error",
        description: "Failed to copy workout",
        variant: "destructive",
      });
    } finally {
      setCopyDialogOpen(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
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
  
  if (!workout) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-6">
          <Link to="/workouts" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Workout Not Found</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          The workout you're looking for doesn't exist or has been deleted.
        </p>
        <Link to="/workouts">
          <Button className="bg-muscle-primary">Go Back to Workouts</Button>
        </Link>
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
        <h1 className="text-2xl font-bold">{workout.name}</h1>
        
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card text-foreground">
              <DropdownMenuItem onClick={() => navigate(`/workouts/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" /> Edit Workout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCopyDialogOpen(true)}>
                <Copy className="h-4 w-4 mr-2" /> Copy Workout
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" /> Delete Workout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="card-gradient p-4 rounded-xl mb-6">
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(workout.date)} • {workout.dayOfWeek.charAt(0) + workout.dayOfWeek.slice(1).toLowerCase()}
        </div>
        
        <div className="mb-2">
          <span className="text-sm text-muted-foreground">Target muscle groups:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {workout.targetMuscleGroups.map((group) => (
              <span 
                key={group.id}
                className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full"
              >
                {group.name}
              </span>
            ))}
          </div>
        </div>
        
        {workout.notes && (
          <div>
            <span className="text-sm text-muted-foreground">Notes:</span>
            <p className="mt-1 text-sm">{workout.notes}</p>
          </div>
        )}
      </Card>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exercises</h2>
          <Link to={`/workouts/${id}/add-exercise`}>
            <Button className="bg-muscle-primary" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </Link>
        </div>
        
        {workout.exercises.length > 0 ? (
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <Card className="card-gradient p-4 rounded-xl" key={exercise.id}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">{exercise.exerciseTemplate.name}</h3>
                  <span className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full">
                    {exercise.totalVolume} kg total
                  </span>
                </div>
                
                <div className="space-y-2">
                  {exercise.sets.map((set, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center bg-muscle-dark/50 p-3 rounded-md"
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-medium bg-muscle-primary/20 text-muscle-accent h-6 w-6 flex items-center justify-center rounded-full mr-2">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{set.reps} reps</span>
                      </div>
                      
                      {exercise.exerciseTemplate.requiresWeight && (
                        <span className="text-sm">{set.weight} kg</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-gradient p-6 rounded-xl text-center">
            <p className="text-muted-foreground mb-4">No exercises added yet</p>
            <Link to={`/workouts/${id}/add-exercise`}>
              <Button className="bg-muscle-primary">
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </Link>
          </Card>
        )}
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Workout</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Copy Workout</DialogTitle>
            <DialogDescription>
              Choose a date for the new workout
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <label className="text-sm font-medium">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2 bg-muscle-dark/50 rounded-md mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-muscle-primary"
              onClick={handleCopy}
              disabled={!newDate}
            >
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkoutDetail;
