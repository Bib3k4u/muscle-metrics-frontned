import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { workoutTemplatesApi } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface ExerciseSet {
  reps: number;
  weight: number;
}

interface ExerciseTemplate {
  id: string;
  name: string;
  description?: string;
  muscleGroups?: Array<{ id: string; name: string }>;
}

interface TemplateExercise {
  exerciseTemplate: ExerciseTemplate;
  sets: ExerciseSet[];
}

interface WorkoutTemplate {
  name: string;
  description: string;
  type: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: TemplateExercise[];
}

const muscleGroups = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "legs", name: "Legs" },
  { id: "arms", name: "Arms" },
  { id: "core", name: "Core" },
  { id: "quadriceps", name: "Quadriceps" },
  { id: "hamstrings", name: "Hamstrings" },
  { id: "calves", name: "Calves" },
  { id: "glutes", name: "Glutes" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
  { id: "traps", name: "Traps" },
  { id: "lats", name: "Lats" }
];

const workoutTypes = ["Push", "Pull", "Legs", "Upper Body", "Lower Body", "Full Body", "Cardio", "Custom"];

// Sample exercises for demo
const sampleExercises: ExerciseTemplate[] = [
  { id: "bench-press", name: "Bench Press", muscleGroups: [{ id: "chest", name: "Chest" }] },
  { id: "squat", name: "Squat", muscleGroups: [{ id: "legs", name: "Legs" }, { id: "quadriceps", name: "Quadriceps" }] },
  { id: "deadlift", name: "Deadlift", muscleGroups: [{ id: "back", name: "Back" }, { id: "legs", name: "Legs" }] },
  { id: "overhead-press", name: "Overhead Press", muscleGroups: [{ id: "shoulders", name: "Shoulders" }] },
  { id: "pull-up", name: "Pull-Up", muscleGroups: [{ id: "back", name: "Back" }, { id: "biceps", name: "Biceps" }] },
  { id: "barbell-row", name: "Barbell Row", muscleGroups: [{ id: "back", name: "Back" }] },
  { id: "leg-press", name: "Leg Press", muscleGroups: [{ id: "legs", name: "Legs" }, { id: "quadriceps", name: "Quadriceps" }] },
  { id: "lat-pulldown", name: "Lat Pulldown", muscleGroups: [{ id: "back", name: "Back" }, { id: "lats", name: "Lats" }] },
  { id: "tricep-pushdown", name: "Tricep Pushdown", muscleGroups: [{ id: "triceps", name: "Triceps" }] },
  { id: "bicep-curl", name: "Bicep Curl", muscleGroups: [{ id: "biceps", name: "Biceps" }] },
];

const CreateWorkoutTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  
  const [template, setTemplate] = useState<WorkoutTemplate>({
    name: '',
    description: '',
    type: '',
    targetMuscleGroups: [],
    exercises: []
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplate({ ...template, name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTemplate({ ...template, description: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    setTemplate({ ...template, type: value });
  };

  const handleMuscleGroupChange = (id: string) => {
    if (selectedMuscleGroups.includes(id)) {
      setSelectedMuscleGroups(selectedMuscleGroups.filter(groupId => groupId !== id));
      setTemplate({
        ...template,
        targetMuscleGroups: template.targetMuscleGroups.filter(group => group.id !== id)
      });
    } else {
      setSelectedMuscleGroups([...selectedMuscleGroups, id]);
      const muscleGroup = muscleGroups.find(group => group.id === id);
      if (muscleGroup) {
        setTemplate({
          ...template,
          targetMuscleGroups: [...template.targetMuscleGroups, muscleGroup]
        });
      }
    }
  };

  const handleExerciseSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExerciseSearchTerm(e.target.value);
    setShowExerciseDropdown(true);
  };

  const addExerciseToTemplate = (exercise: ExerciseTemplate) => {
    const newExercise: TemplateExercise = {
      exerciseTemplate: exercise,
      sets: [{ reps: 10, weight: 0 }]
    };
    
    setTemplate({
      ...template,
      exercises: [...template.exercises, newExercise]
    });
    
    setExerciseSearchTerm('');
    setShowExerciseDropdown(false);
  };

  const removeExerciseFromTemplate = (index: number) => {
    const updatedExercises = [...template.exercises];
    updatedExercises.splice(index, 1);
    
    setTemplate({
      ...template,
      exercises: updatedExercises
    });
  };

  const addSetToExercise = (exerciseIndex: number) => {
    const updatedExercises = [...template.exercises];
    const lastSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1];
    
    updatedExercises[exerciseIndex].sets.push({
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0
    });
    
    setTemplate({
      ...template,
      exercises: updatedExercises
    });
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    if (template.exercises[exerciseIndex].sets.length <= 1) return;
    
    const updatedExercises = [...template.exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    setTemplate({
      ...template,
      exercises: updatedExercises
    });
  };

  const updateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof ExerciseSet,
    value: number
  ) => {
    const updatedExercises = [...template.exercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    
    setTemplate({
      ...template,
      exercises: updatedExercises
    });
  };

  const handleSaveTemplate = async () => {
    // Basic validation
    if (!template.name) {
      toast({
        title: "Missing information",
        description: "Please add a name for your template",
        variant: "destructive",
      });
      return;
    }
    
    if (template.exercises.length === 0) {
      toast({
        title: "No exercises",
        description: "Please add at least one exercise to your template",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      // In a real app, this would be an API call to save the template
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      // Mock save functionality
      toast({
        title: "Template saved",
        description: "Your workout template has been saved successfully.",
        variant: "success",
      });
      
      navigate('/workout-templates');
    } catch (err) {
      console.error('Failed to save template:', err);
      toast({
        title: "Failed to save template",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filter exercises based on search term
  const filteredExercises = sampleExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link to="/workout-templates" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold mb-2">Create Workout Template</h1>
          <p className="text-sm text-muted-foreground">
            Design a reusable workout template
          </p>
        </div>
      </div>
      
      {/* Template details section */}
      <Card className="card-gradient p-4 rounded-xl mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input 
              id="template-name"
              value={template.name}
              onChange={handleNameChange}
              placeholder="E.g., Push Day, Leg Day, Full Body A"
              className="bg-muscle-dark/50 mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Description (Optional)</Label>
            <Textarea 
              id="template-description"
              value={template.description}
              onChange={handleDescriptionChange}
              placeholder="Describe your workout template"
              className="bg-muscle-dark/50 mt-1 min-h-[80px]"
            />
          </div>
          
          <div>
            <Label htmlFor="template-type">Workout Type</Label>
            <Select onValueChange={handleTypeChange} value={template.type}>
              <SelectTrigger className="bg-muscle-dark/50 mt-1">
                <SelectValue placeholder="Select a workout type" />
              </SelectTrigger>
              <SelectContent>
                {workoutTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Target Muscle Groups</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {muscleGroups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleMuscleGroupChange(group.id)}
                  className={`text-xs py-1 px-2 rounded-full ${
                    selectedMuscleGroups.includes(group.id)
                      ? 'bg-muscle-accent text-white'
                      : 'bg-muscle-dark/50 text-muted-foreground'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Exercises section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Exercises</h2>
          <p className="text-sm text-muted-foreground">{template.exercises.length} added</p>
        </div>
        
        {/* Exercise search */}
        <div className="relative mb-4">
          <Input
            value={exerciseSearchTerm}
            onChange={handleExerciseSearch}
            placeholder="Search and add exercises..."
            className="bg-muscle-dark/50"
            onFocus={() => setShowExerciseDropdown(true)}
          />
          
          {showExerciseDropdown && (
            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto card-gradient">
              {filteredExercises.length > 0 ? (
                filteredExercises.map(exercise => (
                  <button
                    key={exercise.id}
                    className="w-full text-left px-3 py-2 hover:bg-muscle-primary/20 flex items-center justify-between"
                    onClick={() => addExerciseToTemplate(exercise)}
                  >
                    <div>
                      <div>{exercise.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.muscleGroups?.map(g => g.name).join(', ')}
                      </div>
                    </div>
                    <Plus className="h-4 w-4" />
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground">
                  No exercises found
                </div>
              )}
              
              <div className="p-2 border-t border-border">
                <button
                  className="text-sm text-muscle-accent w-full text-center"
                  onClick={() => setShowExerciseDropdown(false)}
                >
                  Close
                </button>
              </div>
            </Card>
          )}
        </div>
        
        {/* Added exercises */}
        <div className="space-y-4">
          {template.exercises.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-xl">
              <p className="text-muted-foreground mb-2">No exercises added yet</p>
              <p className="text-sm text-muted-foreground">
                Search and add exercises to your template
              </p>
            </div>
          ) : (
            template.exercises.map((exercise, exerciseIndex) => (
              <Card key={exerciseIndex} className="card-gradient p-3 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-medium">{exercise.exerciseTemplate.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      {exercise.exerciseTemplate.muscleGroups?.map(g => g.name).join(', ')}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExerciseFromTemplate(exerciseIndex)}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-2 bg-muscle-dark/20 p-2 rounded">
                      <div className="min-w-[60px]">
                        <span className="text-xs text-muted-foreground">Set {setIndex + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-xs mb-1">Reps</Label>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              className="h-8 text-sm bg-muscle-dark/50"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <Label className="text-xs mb-1">Weight (kg)</Label>
                            <Input
                              type="number"
                              value={set.weight}
                              onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm bg-muscle-dark/50"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {exercise.sets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                          className="h-8 w-8 flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSetToExercise(exerciseIndex)}
                    className="w-full mt-2 border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Set
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent pt-16">
        <Button
          className="w-full bg-muscle-primary"
          disabled={
            !template.name ||
            template.exercises.length === 0 ||
            saving
          }
          onClick={handleSaveTemplate}
        >
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
              Saving...
            </>
          ) : (
            "Save Template"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateWorkoutTemplate;