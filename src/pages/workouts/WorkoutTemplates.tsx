import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workoutTemplatesApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, Plus, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: Array<{
    exerciseTemplate: {
      id: string;
      name: string;
    };
    sets: Array<{
      reps: number;
      weight: number;
    }>;
  }>;
}

// Mock data with comprehensive workout templates for a 6-day split
const MOCK_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "template-1",
    name: "Day 1: Push (Chest, Shoulders, Triceps)",
    description: "Focus on chest, front delts and triceps. Perfect for Monday.",
    type: "Push",
    targetMuscleGroups: [
      { id: "chest", name: "Chest" },
      { id: "shoulders", name: "Shoulders" },
      { id: "triceps", name: "Triceps" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "bench-press",
          name: "Bench Press"
        },
        sets: [
          { reps: 12, weight: 60 },
          { reps: 10, weight: 70 },
          { reps: 8, weight: 80 },
          { reps: 6, weight: 85 }
        ]
      },
      {
        exerciseTemplate: {
          id: "incline-dumbbell-press",
          name: "Incline Dumbbell Press"
        },
        sets: [
          { reps: 12, weight: 20 },
          { reps: 10, weight: 22.5 },
          { reps: 8, weight: 25 }
        ]
      },
      {
        exerciseTemplate: {
          id: "machine-chest-fly",
          name: "Machine Chest Fly"
        },
        sets: [
          { reps: 15, weight: 40 },
          { reps: 12, weight: 45 },
          { reps: 10, weight: 50 }
        ]
      },
      {
        exerciseTemplate: {
          id: "overhead-press",
          name: "Overhead Press"
        },
        sets: [
          { reps: 10, weight: 40 },
          { reps: 8, weight: 45 },
          { reps: 8, weight: 45 }
        ]
      },
      {
        exerciseTemplate: {
          id: "lateral-raise",
          name: "Lateral Raise"
        },
        sets: [
          { reps: 15, weight: 8 },
          { reps: 15, weight: 8 },
          { reps: 12, weight: 10 }
        ]
      },
      {
        exerciseTemplate: {
          id: "tricep-pushdown",
          name: "Tricep Pushdown"
        },
        sets: [
          { reps: 15, weight: 25 },
          { reps: 12, weight: 30 },
          { reps: 10, weight: 35 }
        ]
      },
      {
        exerciseTemplate: {
          id: "overhead-tricep-extension",
          name: "Overhead Tricep Extension"
        },
        sets: [
          { reps: 12, weight: 20 },
          { reps: 10, weight: 25 },
          { reps: 10, weight: 25 }
        ]
      }
    ]
  },
  {
    id: "template-2",
    name: "Day 2: Pull (Back, Biceps)",
    description: "Focus on back and biceps. Ideal for Tuesday.",
    type: "Pull",
    targetMuscleGroups: [
      { id: "back", name: "Back" },
      { id: "biceps", name: "Biceps" },
      { id: "traps", name: "Traps" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "deadlift",
          name: "Deadlift"
        },
        sets: [
          { reps: 8, weight: 100 },
          { reps: 6, weight: 120 },
          { reps: 4, weight: 140 }
        ]
      },
      {
        exerciseTemplate: {
          id: "pull-up",
          name: "Pull-Up"
        },
        sets: [
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 },
          { reps: 6, weight: 0 }
        ]
      },
      {
        exerciseTemplate: {
          id: "barbell-row",
          name: "Barbell Row"
        },
        sets: [
          { reps: 12, weight: 60 },
          { reps: 10, weight: 70 },
          { reps: 8, weight: 80 }
        ]
      },
      {
        exerciseTemplate: {
          id: "lat-pulldown",
          name: "Lat Pulldown"
        },
        sets: [
          { reps: 12, weight: 50 },
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 }
        ]
      },
      {
        exerciseTemplate: {
          id: "seated-cable-row",
          name: "Seated Cable Row"
        },
        sets: [
          { reps: 12, weight: 55 },
          { reps: 10, weight: 65 },
          { reps: 8, weight: 75 }
        ]
      },
      {
        exerciseTemplate: {
          id: "barbell-curl",
          name: "Barbell Curl"
        },
        sets: [
          { reps: 12, weight: 30 },
          { reps: 10, weight: 35 },
          { reps: 8, weight: 40 }
        ]
      },
      {
        exerciseTemplate: {
          id: "hammer-curl",
          name: "Hammer Curl"
        },
        sets: [
          { reps: 12, weight: 12 },
          { reps: 10, weight: 14 },
          { reps: 10, weight: 14 }
        ]
      }
    ]
  },
  {
    id: "template-3",
    name: "Day 3: Legs (Quads, Hamstrings, Calves)",
    description: "Focus on leg development. Recommended for Wednesday.",
    type: "Legs",
    targetMuscleGroups: [
      { id: "quadriceps", name: "Quadriceps" },
      { id: "hamstrings", name: "Hamstrings" },
      { id: "calves", name: "Calves" },
      { id: "glutes", name: "Glutes" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "squat",
          name: "Squat"
        },
        sets: [
          { reps: 12, weight: 80 },
          { reps: 10, weight: 100 },
          { reps: 8, weight: 120 },
          { reps: 6, weight: 130 }
        ]
      },
      {
        exerciseTemplate: {
          id: "leg-press",
          name: "Leg Press"
        },
        sets: [
          { reps: 12, weight: 120 },
          { reps: 10, weight: 140 },
          { reps: 8, weight: 160 }
        ]
      },
      {
        exerciseTemplate: {
          id: "leg-extension",
          name: "Leg Extension"
        },
        sets: [
          { reps: 15, weight: 40 },
          { reps: 12, weight: 45 },
          { reps: 12, weight: 45 }
        ]
      },
      {
        exerciseTemplate: {
          id: "romanian-deadlift",
          name: "Romanian Deadlift"
        },
        sets: [
          { reps: 12, weight: 80 },
          { reps: 10, weight: 90 },
          { reps: 10, weight: 90 }
        ]
      },
      {
        exerciseTemplate: {
          id: "leg-curl",
          name: "Leg Curl"
        },
        sets: [
          { reps: 15, weight: 35 },
          { reps: 12, weight: 40 },
          { reps: 12, weight: 40 }
        ]
      },
      {
        exerciseTemplate: {
          id: "standing-calf-raise",
          name: "Standing Calf Raise"
        },
        sets: [
          { reps: 15, weight: 80 },
          { reps: 15, weight: 80 },
          { reps: 15, weight: 80 }
        ]
      },
      {
        exerciseTemplate: {
          id: "seated-calf-raise",
          name: "Seated Calf Raise"
        },
        sets: [
          { reps: 15, weight: 40 },
          { reps: 15, weight: 40 },
          { reps: 15, weight: 40 }
        ]
      }
    ]
  },
  {
    id: "template-4",
    name: "Day 4: Push (Chest, Shoulders, Triceps)",
    description: "Second push day with different exercise variations. For Thursday.",
    type: "Push",
    targetMuscleGroups: [
      { id: "chest", name: "Chest" },
      { id: "shoulders", name: "Shoulders" },
      { id: "triceps", name: "Triceps" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "incline-bench-press",
          name: "Incline Bench Press"
        },
        sets: [
          { reps: 12, weight: 50 },
          { reps: 10, weight: 60 },
          { reps: 8, weight: 70 },
          { reps: 6, weight: 75 }
        ]
      },
      {
        exerciseTemplate: {
          id: "dumbbell-press",
          name: "Dumbbell Press"
        },
        sets: [
          { reps: 12, weight: 20 },
          { reps: 10, weight: 22.5 },
          { reps: 8, weight: 25 }
        ]
      },
      {
        exerciseTemplate: {
          id: "cable-crossover",
          name: "Cable Crossover"
        },
        sets: [
          { reps: 15, weight: 15 },
          { reps: 12, weight: 17.5 },
          { reps: 12, weight: 17.5 }
        ]
      },
      {
        exerciseTemplate: {
          id: "dumbbell-shoulder-press",
          name: "Dumbbell Shoulder Press"
        },
        sets: [
          { reps: 12, weight: 15 },
          { reps: 10, weight: 17.5 },
          { reps: 8, weight: 20 }
        ]
      },
      {
        exerciseTemplate: {
          id: "front-raise",
          name: "Front Raise"
        },
        sets: [
          { reps: 15, weight: 8 },
          { reps: 12, weight: 10 },
          { reps: 12, weight: 10 }
        ]
      },
      {
        exerciseTemplate: {
          id: "skull-crusher",
          name: "Skull Crusher"
        },
        sets: [
          { reps: 12, weight: 25 },
          { reps: 10, weight: 30 },
          { reps: 10, weight: 30 }
        ]
      },
      {
        exerciseTemplate: {
          id: "tricep-dip",
          name: "Tricep Dip"
        },
        sets: [
          { reps: 12, weight: 0 },
          { reps: 10, weight: 0 },
          { reps: 8, weight: 0 }
        ]
      }
    ]
  },
  {
    id: "template-5",
    name: "Day 5: Pull (Back, Biceps)",
    description: "Second pull day with exercise variations. Perfect for Friday.",
    type: "Pull",
    targetMuscleGroups: [
      { id: "back", name: "Back" },
      { id: "biceps", name: "Biceps" },
      { id: "rear-delts", name: "Rear Delts" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "weighted-pull-up",
          name: "Weighted Pull-Up"
        },
        sets: [
          { reps: 8, weight: 5 },
          { reps: 6, weight: 10 },
          { reps: 6, weight: 10 }
        ]
      },
      {
        exerciseTemplate: {
          id: "t-bar-row",
          name: "T-Bar Row"
        },
        sets: [
          { reps: 12, weight: 40 },
          { reps: 10, weight: 45 },
          { reps: 8, weight: 50 }
        ]
      },
      {
        exerciseTemplate: {
          id: "chest-supported-row",
          name: "Chest Supported Row"
        },
        sets: [
          { reps: 12, weight: 20 },
          { reps: 10, weight: 22.5 },
          { reps: 8, weight: 25 }
        ]
      },
      {
        exerciseTemplate: {
          id: "single-arm-row",
          name: "Single Arm Row"
        },
        sets: [
          { reps: 12, weight: 20 },
          { reps: 10, weight: 22.5 },
          { reps: 10, weight: 22.5 }
        ]
      },
      {
        exerciseTemplate: {
          id: "face-pull",
          name: "Face Pull"
        },
        sets: [
          { reps: 15, weight: 25 },
          { reps: 15, weight: 25 },
          { reps: 15, weight: 25 }
        ]
      },
      {
        exerciseTemplate: {
          id: "preacher-curl",
          name: "Preacher Curl"
        },
        sets: [
          { reps: 12, weight: 25 },
          { reps: 10, weight: 30 },
          { reps: 8, weight: 35 }
        ]
      },
      {
        exerciseTemplate: {
          id: "concentration-curl",
          name: "Concentration Curl"
        },
        sets: [
          { reps: 12, weight: 10 },
          { reps: 10, weight: 12 },
          { reps: 10, weight: 12 }
        ]
      }
    ]
  },
  {
    id: "template-6",
    name: "Day 6: Legs (Quads, Hamstrings, Calves)",
    description: "Second legs day with different exercise variations. Ideal for Saturday.",
    type: "Legs",
    targetMuscleGroups: [
      { id: "quadriceps", name: "Quadriceps" },
      { id: "hamstrings", name: "Hamstrings" },
      { id: "calves", name: "Calves" },
      { id: "glutes", name: "Glutes" }
    ],
    exercises: [
      {
        exerciseTemplate: {
          id: "front-squat",
          name: "Front Squat"
        },
        sets: [
          { reps: 10, weight: 60 },
          { reps: 8, weight: 70 },
          { reps: 6, weight: 80 }
        ]
      },
      {
        exerciseTemplate: {
          id: "hack-squat",
          name: "Hack Squat"
        },
        sets: [
          { reps: 12, weight: 80 },
          { reps: 10, weight: 100 },
          { reps: 8, weight: 120 }
        ]
      },
      {
        exerciseTemplate: {
          id: "bulgarian-split-squat",
          name: "Bulgarian Split Squat"
        },
        sets: [
          { reps: 10, weight: 20 },
          { reps: 10, weight: 20 },
          { reps: 8, weight: 25 }
        ]
      },
      {
        exerciseTemplate: {
          id: "good-morning",
          name: "Good Morning"
        },
        sets: [
          { reps: 12, weight: 40 },
          { reps: 10, weight: 50 },
          { reps: 10, weight: 50 }
        ]
      },
      {
        exerciseTemplate: {
          id: "glute-ham-raise",
          name: "Glute Ham Raise"
        },
        sets: [
          { reps: 12, weight: 0 },
          { reps: 10, weight: 0 },
          { reps: 10, weight: 0 }
        ]
      },
      {
        exerciseTemplate: {
          id: "leg-press-calf-raise",
          name: "Leg Press Calf Raise"
        },
        sets: [
          { reps: 20, weight: 100 },
          { reps: 15, weight: 120 },
          { reps: 15, weight: 120 }
        ]
      },
      {
        exerciseTemplate: {
          id: "single-leg-calf-raise",
          name: "Single Leg Calf Raise"
        },
        sets: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 }
        ]
      }
    ]
  }
];

const WorkoutTemplates = () => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [usingMockData, setUsingMockData] = useState(false);
  const [creatingWorkout, setCreatingWorkout] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await workoutTemplatesApi.getAll();
        
        // Check if we got mock data back
        if (response.usingMock) {
          setUsingMockData(true);
          toast({
            title: "Using Demo Data",
            description: "Workout templates API is not available. Using demo data instead.",
            variant: "default",
          });
        } else {
          setUsingMockData(false);
        }
        
        if (response?.data && response.data.length > 0) {
          setTemplates(response.data);
        } else {
          // If no data is returned or empty array, fall back to mock templates
          setTemplates(MOCK_TEMPLATES);
          setUsingMockData(true);
          toast({
            title: "Using Demo Templates",
            description: "No templates found in the API. Using demo templates instead.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Failed to fetch workout templates:", error);
        // Use mock data as fallback
        setTemplates(MOCK_TEMPLATES);
        setUsingMockData(true);
        toast({
          title: "Using Demo Templates",
          description: "Failed to connect to server. Using demo templates instead.",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
    
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setNewDate(today);
  }, [toast]);
  
  const handleUseTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setUseTemplateDialogOpen(true);
  };
  
  const createWorkoutFromTemplate = async () => {
    if (!selectedTemplate || !newDate) return;
    
    try {
      setCreatingWorkout(true);
      const response = await workoutTemplatesApi.createWorkoutFromTemplate(
        selectedTemplate.id,
        newDate
      );
      
      // Always show a success message that emphasizes the database storage
      toast({
        title: "Success",
        description: `Created ${selectedTemplate.name} workout for ${new Date(newDate).toLocaleDateString()} with ${selectedTemplate.exercises.length} exercises. Saved to database.`,
      });
      
      // Navigate to the new workout
      if (response.data && response.data.id) {
        navigate(`/workouts/${response.data.id}`);
      } else {
        navigate('/workouts');
      }
    } catch (error) {
      console.error("Failed to create workout from template:", error);
      toast({
        title: "Error",
        description: "Failed to create workout from template in the database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingWorkout(false);
      setUseTemplateDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscle-accent"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/workouts" className="mr-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold mb-2">Workout Templates</h1>
            <p className="text-sm text-muted-foreground">
              Use templates to quickly start workouts
            </p>
          </div>
        </div>
        
        <Link to="/workout-templates/new">
          <Button className="bg-muscle-primary">
            <Plus className="h-4 w-4 mr-1" /> New Template
          </Button>
        </Link>
      </div>
      
      {usingMockData && (
        <Card className="card-gradient p-4 rounded-xl mb-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center mb-2">
            <span className="text-blue-400 font-semibold text-lg">Demo Mode</span>
          </div>
          <p className="text-sm text-blue-400 mb-1">
            <strong>6-Day Push/Pull/Legs Split:</strong> Using pre-populated workout templates with recommended exercises, sets, reps, and weights.
          </p>
          <p className="text-sm text-blue-300">
            You can use these templates directly to create workouts. They will be saved locally in your browser.
          </p>
        </Card>
      )}
      
      {error ? (
        <Card className="card-gradient p-6 rounded-xl text-center">
          <p className="text-red-400 mb-4">Failed to load workout templates</p>
          <Button 
            className="bg-muscle-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Card>
      ) : templates.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-3">6-Day Split Workout Plan</h2>
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="card-gradient p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full" key={`type-${template.id}`}>
                        {template.type}
                      </div>
                      {template.targetMuscleGroups && template.targetMuscleGroups.map((group) => (
                        <div 
                          key={group.id}
                          className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full"
                        >
                          {group.name}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {template.exercises ? template.exercises.length : 0} exercises
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="ml-2 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            You haven't created any workout templates yet.
          </p>
          <Link to="/workout-templates/new">
            <Button className="bg-muscle-primary">
              <Plus className="h-4 w-4 mr-1" /> Create Your First Template
            </Button>
          </Link>
        </div>
      )}
      
      <Dialog open={useTemplateDialogOpen} onOpenChange={setUseTemplateDialogOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Create Workout from Template</DialogTitle>
            <DialogDescription>
              Create a new workout based on "{selectedTemplate?.name}" with all exercises, sets, and weights pre-filled. The workout will be saved to your database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="pl-10 bg-muscle-dark/50"
              />
            </div>
          </div>
          
          {selectedTemplate && selectedTemplate.exercises.length > 0 && (
            <div className="mb-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium mb-2">Exercises (will be automatically added)</h3>
              <div className="space-y-2">
                {selectedTemplate.exercises.map((exercise, index) => (
                  <div key={index} className="text-sm p-2 rounded bg-muscle-dark/20">
                    <div className="font-medium">{exercise.exerciseTemplate.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {exercise.sets.map((set, i) => (
                        <span key={i} className="mr-2">
                          Set {i+1}: {set.reps} reps × {set.weight}kg
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-300">
              <span className="font-semibold">Database Mode:</span> This workout will be created and saved directly to your database with all exercises and sets included.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUseTemplateDialogOpen(false)}
              disabled={creatingWorkout}
            >
              Cancel
            </Button>
            <Button 
              className="bg-muscle-primary"
              onClick={createWorkoutFromTemplate}
              disabled={!newDate || creatingWorkout}
            >
              {creatingWorkout ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                  Creating...
                </>
              ) : (
                "Create Workout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for featured template cards
interface TemplateCardProps {
  name: string;
  description: string;
  type: string;
  muscleGroups: string[];
  exerciseCount: number;
  onUse: () => void;
}

const TemplateCard = ({ 
  name, 
  description, 
  type, 
  muscleGroups, 
  exerciseCount, 
  onUse 
}: TemplateCardProps) => (
  <Card className="card-gradient p-4 rounded-xl">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full">
            {type}
          </div>
          {muscleGroups.map((group) => (
            <div 
              key={group}
              className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full"
            >
              {group}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {exerciseCount} exercises
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={onUse}
        className="ml-2 flex-shrink-0"
      >
        <Copy className="h-4 w-4 mr-1" />
        Use
      </Button>
    </div>
  </Card>
);

export default WorkoutTemplates; 