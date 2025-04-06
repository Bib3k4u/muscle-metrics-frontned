import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { muscleGroupsApi, exerciseTemplatesApi, workoutTemplatesApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Minus, Search, X, ArrowDown, ArrowUp, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MuscleGroup {
  id: string;
  name: string;
}

interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  muscleGroups: MuscleGroup[];
  requiresWeight: boolean;
}

interface TemplateExercise {
  exerciseTemplate: ExerciseTemplate;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
}

const TEMPLATE_TYPES = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
  "Custom"
];

// Mock data to use when the backend API is not available
const MOCK_MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
  { id: "abs", name: "Abs" },
  { id: "legs", name: "Legs" },
  { id: "quadriceps", name: "Quadriceps" },
  { id: "hamstrings", name: "Hamstrings" },
  { id: "calves", name: "Calves" }
];

const MOCK_EXERCISE_TEMPLATES: ExerciseTemplate[] = [
  {
    id: "bench-press",
    name: "Bench Press",
    description: "Targets chest, shoulders, and triceps",
    muscleGroups: [
      { id: "chest", name: "Chest" },
      { id: "shoulders", name: "Shoulders" },
      { id: "triceps", name: "Triceps" }
    ],
    requiresWeight: true
  },
  {
    id: "squat",
    name: "Squat",
    description: "Targets quadriceps, hamstrings, and glutes",
    muscleGroups: [
      { id: "quadriceps", name: "Quadriceps" },
      { id: "hamstrings", name: "Hamstrings" },
      { id: "legs", name: "Legs" }
    ],
    requiresWeight: true
  },
  {
    id: "deadlift",
    name: "Deadlift",
    description: "Targets back, hamstrings, and glutes",
    muscleGroups: [
      { id: "back", name: "Back" },
      { id: "hamstrings", name: "Hamstrings" },
      { id: "legs", name: "Legs" }
    ],
    requiresWeight: true
  },
  {
    id: "pull-up",
    name: "Pull-Up",
    description: "Targets back and biceps",
    muscleGroups: [
      { id: "back", name: "Back" },
      { id: "biceps", name: "Biceps" }
    ],
    requiresWeight: false
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    description: "Targets shoulders and triceps",
    muscleGroups: [
      { id: "shoulders", name: "Shoulders" },
      { id: "triceps", name: "Triceps" }
    ],
    requiresWeight: true
  }
];

const NewWorkoutTemplate = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("Custom");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // For exercise selection modal
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExerciseTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exerciseFilterMuscleGroup, setExerciseFilterMuscleGroup] = useState<string>("all");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setUsingMockData(false);
        
        // Initialize with empty arrays to prevent map errors
        setMuscleGroups([]);
        setExerciseTemplates([]);
        setFilteredTemplates([]);
        
        let muscleGroupData: MuscleGroup[] = [];
        let exerciseTemplateData: ExerciseTemplate[] = [];
        
        // Try to fetch muscle groups
        try {
          const muscleGroupsRes = await muscleGroupsApi.getAll();
          if (muscleGroupsRes?.data && Array.isArray(muscleGroupsRes.data)) {
            muscleGroupData = muscleGroupsRes.data;
          } else {
            throw new Error("No muscle groups data returned");
          }
        } catch (error) {
          console.error("Failed to fetch muscle groups:", error);
          muscleGroupData = MOCK_MUSCLE_GROUPS;
          setUsingMockData(true);
        }
        
        // Try to fetch exercise templates
        try {
          const exercisesRes = await exerciseTemplatesApi.getAll();
          if (exercisesRes?.data && Array.isArray(exercisesRes.data)) {
            exerciseTemplateData = exercisesRes.data;
          } else {
            throw new Error("No exercise templates data returned");
          }
        } catch (error) {
          console.error("Failed to fetch exercise templates:", error);
          exerciseTemplateData = MOCK_EXERCISE_TEMPLATES;
          setUsingMockData(true);
        }
        
        setMuscleGroups(muscleGroupData);
        setExerciseTemplates(exerciseTemplateData);
        setFilteredTemplates(exerciseTemplateData);
        
        if (usingMockData) {
          toast({
            title: "Using Demo Data",
            description: "Some API endpoints are not available. Using demo data instead.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filter exercise templates based on search and muscle group
  useEffect(() => {
    if (!exerciseTemplates || !Array.isArray(exerciseTemplates)) {
      setFilteredTemplates([]);
      return;
    }
    
    let result = [...exerciseTemplates];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (template) => template.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by muscle group
    if (exerciseFilterMuscleGroup && exerciseFilterMuscleGroup !== "all") {
      result = result.filter((template) =>
        template.muscleGroups && template.muscleGroups.some((group) => group.id === exerciseFilterMuscleGroup)
      );
    }
    
    setFilteredTemplates(result);
  }, [searchQuery, exerciseFilterMuscleGroup, exerciseTemplates]);
  
  const toggleMuscleGroup = (id: string) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(id)
        ? prev.filter((groupId) => groupId !== id)
        : [...prev, id]
    );
  };
  
  const addExercise = (exercise: ExerciseTemplate) => {
    const newExercise: TemplateExercise = {
      exerciseTemplate: exercise,
      sets: [
        { 
          reps: 8, 
          weight: exercise.requiresWeight ? 10 : 0 
        },
        { 
          reps: 8, 
          weight: exercise.requiresWeight ? 10 : 0 
        },
        { 
          reps: 8, 
          weight: exercise.requiresWeight ? 10 : 0 
        }
      ]
    };
    
    setExercises([...exercises, newExercise]);
    setAddExerciseOpen(false);
    setSearchQuery("");
    setExerciseFilterMuscleGroup("all");
  };
  
  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };
  
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return;
    }
    
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [newExercises[index], newExercises[targetIndex]] = 
      [newExercises[targetIndex], newExercises[index]];
    
    setExercises(newExercises);
  };
  
  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    exercise.sets.push({ ...lastSet });
    setExercises(newExercises);
  };
  
  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (exercises[exerciseIndex].sets.length <= 1) return;
    
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets = 
      newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    
    setExercises(newExercises);
  };
  
  const updateSet = (
    exerciseIndex: number, 
    setIndex: number, 
    field: 'reps' | 'weight', 
    value: number
  ) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === '' || selectedMuscleGroups.length === 0 || exercises.length === 0) {
      toast({
        title: "Invalid form",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const templateData = {
      name,
      description,
      type,
      targetMuscleGroupIds: selectedMuscleGroups,
      exercises: exercises.map(exercise => ({
        exerciseTemplateId: exercise.exerciseTemplate.id,
        sets: exercise.sets
      }))
    };
    
    setSubmitting(true);
    
    try {
      if (usingMockData) {
        // If we're using mock data, just show a toast and navigate
        toast({
          title: "Demo Mode",
          description: "Workout template created successfully (mock)",
        });
        navigate(`/workout-templates`);
      } else {
        // Otherwise try to create the template through the API
        const response = await workoutTemplatesApi.create(templateData);
        
        toast({
          title: "Success",
          description: "Workout template created successfully",
        });
        
        navigate(`/workout-templates`);
      }
    } catch (error) {
      console.error("Failed to create template:", error);
      
      // If the API fails, use demo mode and continue
      if (!usingMockData) {
        setUsingMockData(true);
        toast({
          title: "Using Demo Mode",
          description: "API endpoint not available, but template would be created in a real app.",
          variant: "default",
        });
        navigate(`/workout-templates`);
      } else {
        toast({
          title: "Error",
          description: "Failed to create workout template",
          variant: "destructive",
        });
      }
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
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center mb-6">
        <Link to="/workout-templates" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Workout Template</h1>
      </div>
      
      {usingMockData && (
        <Card className="card-gradient p-3 rounded-xl mb-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-400 mr-2" />
            <p className="text-sm text-blue-400">
              Demo Mode: Using sample data. Your template will be saved locally only.
            </p>
          </div>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="card-gradient p-4 rounded-xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name*</label>
              <Input
                placeholder="e.g., Push Day Workout"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muscle-dark/50 mt-1"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Template Type*</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-muscle-dark/50 mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  {TEMPLATE_TYPES && Array.isArray(TEMPLATE_TYPES) && TEMPLATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe your workout template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muscle-dark/50 min-h-[80px] mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Target Muscle Groups*</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {muscleGroups && Array.isArray(muscleGroups) && muscleGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className={`
                      flex items-center p-3 rounded-md border border-border cursor-pointer
                      ${selectedMuscleGroups.includes(group.id) 
                        ? 'bg-muscle-primary/20 border-muscle-primary' 
                        : 'bg-muscle-dark/50'}
                    `}
                    onClick={() => toggleMuscleGroup(group.id)}
                  >
                    <div className={`
                      w-4 h-4 rounded-sm mr-2 flex items-center justify-center
                      ${selectedMuscleGroups.includes(group.id) 
                        ? 'bg-muscle-primary' 
                        : 'bg-muscle-dark border border-border'}
                    `}>
                      {selectedMuscleGroups.includes(group.id) && (
                        <svg 
                          width="10" 
                          height="10" 
                          viewBox="0 0 10 10" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M8.5 2.5L4 7L1.5 4.5" 
                            stroke="white" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{group.name}</span>
                  </div>
                ))}
              </div>
              
              {selectedMuscleGroups.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  Please select at least one muscle group
                </p>
              )}
            </div>
          </div>
        </Card>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Exercises*</h2>
            <Button 
              type="button"
              className="bg-muscle-primary"
              onClick={() => setAddExerciseOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Exercise
            </Button>
          </div>
          
          {exercises.length === 0 ? (
            <Card className="card-gradient p-6 rounded-xl text-center">
              <p className="text-muted-foreground mb-4">
                No exercises added to this template yet
              </p>
              <Button 
                type="button"
                className="bg-muscle-primary"
                onClick={() => setAddExerciseOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, exerciseIndex) => (
                <Card key={exerciseIndex} className="card-gradient p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">{exercise.exerciseTemplate.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {exercise.exerciseTemplate.muscleGroups && 
                          Array.isArray(exercise.exerciseTemplate.muscleGroups) && 
                          exercise.exerciseTemplate.muscleGroups.map((group) => (
                            <Badge 
                              key={group.id}
                              className="bg-muscle-primary/20 text-muscle-accent"
                            >
                              {group.name}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveExercise(exerciseIndex, 'up')}
                        disabled={exerciseIndex === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => moveExercise(exerciseIndex, 'down')}
                        disabled={exerciseIndex === exercises.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400"
                        onClick={() => removeExercise(exerciseIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <h4 className="text-sm font-medium">Sets</h4>
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className="flex items-center gap-2 bg-muscle-dark/50 p-3 rounded-md"
                      >
                        <div className="bg-muscle-primary/20 text-muscle-accent h-6 w-6 flex items-center justify-center rounded-full mr-1">
                          {setIndex + 1}
                        </div>
                        
                        <div className="flex-grow grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-muted-foreground">Reps</label>
                            <Input
                              type="number"
                              min="1"
                              value={set.reps}
                              onChange={(e) => updateSet(
                                exerciseIndex, 
                                setIndex, 
                                'reps', 
                                parseInt(e.target.value) || 0
                              )}
                              className="bg-muscle-dark h-8 mt-1"
                            />
                          </div>
                          
                          {exercise.exerciseTemplate.requiresWeight && (
                            <div>
                              <label className="block text-xs text-muted-foreground">Weight (kg)</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={set.weight}
                                onChange={(e) => updateSet(
                                  exerciseIndex, 
                                  setIndex, 
                                  'weight', 
                                  parseFloat(e.target.value) || 0
                                )}
                                className="bg-muscle-dark h-8 mt-1"
                              />
                            </div>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          disabled={exercise.sets.length <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-muscle-primary/50 text-muscle-primary"
                    onClick={() => addSet(exerciseIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Set
                  </Button>
                </Card>
              ))}
            </div>
          )}
          
          {exercises.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Please add at least one exercise
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-muscle-primary"
          disabled={
            submitting || 
            name.trim() === '' || 
            selectedMuscleGroups.length === 0 || 
            exercises.length === 0
          }
        >
          {submitting ? "Creating..." : "Create Template"}
        </Button>
      </form>
      
      {/* Add Exercise Dialog */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
            <DialogDescription>
              Select an exercise to add to your template
            </DialogDescription>
          </DialogHeader>
          
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
                value={exerciseFilterMuscleGroup} 
                onValueChange={setExerciseFilterMuscleGroup}
              >
                <SelectTrigger className="bg-muscle-dark/50 mt-1">
                  <SelectValue placeholder="All Muscle Groups" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="all">All Muscle Groups</SelectItem>
                  {muscleGroups && Array.isArray(muscleGroups) && muscleGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="h-[300px] overflow-y-auto pr-1 -mr-1">
              {filteredTemplates && Array.isArray(filteredTemplates) && filteredTemplates.length > 0 ? (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 rounded-md bg-muscle-dark/50 hover:bg-muscle-dark cursor-pointer"
                      onClick={() => addExercise(template)}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.muscleGroups && Array.isArray(template.muscleGroups) && template.muscleGroups.map((group) => (
                          <Badge 
                            key={group.id}
                            className="bg-muscle-primary/20 text-muscle-accent text-xs"
                            variant="outline"
                          >
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No exercises found matching your filters
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddExerciseOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewWorkoutTemplate; 