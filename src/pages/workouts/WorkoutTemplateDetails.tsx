import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { workoutTemplatesApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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

const WorkoutTemplateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [creatingWorkout, setCreatingWorkout] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const data = await workoutTemplatesApi.getById(id || '');
        setTemplate(data);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch template:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const handleUseTemplate = () => {
    setUseTemplateDialogOpen(true);
  };

  const createWorkoutFromTemplate = async () => {
    if (!template) return;
    
    try {
      setCreatingWorkout(true);
      await workoutTemplatesApi.createWorkoutFromTemplate(template.id, newDate);
      
      toast({
        title: "Workout created",
        description: "Your workout has been created successfully.",
        variant: "success",
      });
      
      setUseTemplateDialogOpen(false);
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to create workout:', err);
      toast({
        title: "Failed to create workout",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCreatingWorkout(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscle-accent"></div>
      </div>
    );
  }
  
  if (error || !template) {
    return (
      <div className="p-4">
        <Card className="card-gradient p-6 rounded-xl text-center">
          <p className="text-red-400 mb-4">Failed to load workout template</p>
          <Button 
            className="bg-muscle-primary mr-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/workout-templates')}
          >
            Back to Templates
          </Button>
        </Card>
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
        <div>
          <h1 className="text-xl font-bold mb-2">{template.name}</h1>
          <p className="text-sm text-muted-foreground">
            Template details and exercises
          </p>
        </div>
      </div>
      
      <Card className="card-gradient p-4 rounded-xl mb-4">
        <div className="mb-3">
          <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full">
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
        </div>
        
        <Button 
          className="w-full bg-muscle-primary"
          onClick={handleUseTemplate}
        >
          <Copy className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </Card>
      
      {/* Exercises section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Exercises</h2>
        <div className="space-y-3">
          {template.exercises.map((exercise, index) => (
            <Card key={index} className="card-gradient p-3 rounded-xl">
              <h3 className="font-medium">{exercise.exerciseTemplate.name}</h3>
              <div className="mt-2 space-y-1">
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex justify-between text-sm p-2 rounded bg-muscle-dark/20">
                    <span>Set {setIndex + 1}</span>
                    <span>{set.reps} reps × {set.weight}kg</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Dialog for creating workout from template */}
      <Dialog open={useTemplateDialogOpen} onOpenChange={setUseTemplateDialogOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Create Workout from Template</DialogTitle>
            <DialogDescription>
              Create a new workout based on "{template.name}" with all exercises, sets, and weights pre-filled.
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
          
          <div className="mb-4 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">Exercises (will be automatically added)</h3>
            <div className="space-y-2">
              {template.exercises.map((exercise, index) => (
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

export default WorkoutTemplateDetails; 