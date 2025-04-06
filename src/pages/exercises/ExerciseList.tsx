import { useState, useEffect } from "react";
import { muscleGroupsApi, exerciseTemplatesApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronDown, Info } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MuscleGroup {
  id: string;
  name: string;
}

interface ExerciseTemplate {
  id: string;
  name: string;
  primaryMuscleGroup: MuscleGroup;
  secondaryMuscleGroup?: MuscleGroup | null;
  description: string;
  requiresWeight: boolean;
}

const ExerciseList = () => {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseTemplate[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseTemplate | null>(null);
  
  useEffect(() => {
    const fetchMuscleGroups = async () => {
      try {
        const response = await muscleGroupsApi.getAll();
        setMuscleGroups(response.data);
      } catch (error) {
        console.error("Failed to fetch muscle groups:", error);
      }
    };
    
    fetchMuscleGroups();
  }, []);
  
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        let response;
        
        if (selectedMuscleGroup && selectedMuscleGroup !== "all") {
          response = await exerciseTemplatesApi.getByMuscleGroup(selectedMuscleGroup);
        } else {
          response = await exerciseTemplatesApi.getAll();
        }
        
        setExercises(response.data);
        setFilteredExercises(response.data);
      } catch (error) {
        console.error("Failed to fetch exercises:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercises();
  }, [selectedMuscleGroup]);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.primaryMuscleGroup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.secondaryMuscleGroup &&
          exercise.secondaryMuscleGroup.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchTerm, exercises]);
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold mb-2">Exercise Library</h1>
          <p className="text-muted-foreground text-sm">
            Browse all available exercises
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
      </div>
      
      <div className="mb-6 space-y-3">
        <div className="flex justify-between">
          <Select
            value={selectedMuscleGroup}
            onValueChange={setSelectedMuscleGroup}
          >
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Filter by muscle group" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground">
              <SelectItem value="all">All Muscle Groups</SelectItem>
              {muscleGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muscle-accent"></div>
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <Card className="card-gradient p-4 rounded-xl" key={exercise.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{exercise.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs bg-muscle-primary/20 text-muscle-accent py-1 px-2 rounded-full">
                      {exercise.primaryMuscleGroup.name}
                    </span>
                    {exercise.secondaryMuscleGroup && (
                      <span className="text-xs bg-secondary/20 text-muted-foreground py-1 px-2 rounded-full">
                        {exercise.secondaryMuscleGroup.name}
                      </span>
                    )}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-foreground max-w-md">
                    <DialogHeader>
                      <DialogTitle>{exercise.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Primary Muscle Group
                        </h4>
                        <p>{exercise.primaryMuscleGroup.name}</p>
                      </div>
                      
                      {exercise.secondaryMuscleGroup && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">
                            Secondary Muscle Group
                          </h4>
                          <p>{exercise.secondaryMuscleGroup.name}</p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Description
                        </h4>
                        <p className="text-sm">{exercise.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Requires Weight
                        </h4>
                        <p>{exercise.requiresWeight ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-6">
          <div className="bg-card rounded-full p-4 inline-flex mb-4">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No exercises found</h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try a different search term"
              : "Try selecting a different muscle group"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExerciseList;
