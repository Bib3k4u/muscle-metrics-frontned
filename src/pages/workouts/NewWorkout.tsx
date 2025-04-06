import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { muscleGroupsApi, workoutsApi } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MuscleGroup {
  id: string;
  name: string;
}

const NewWorkout = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    
    const fetchMuscleGroups = async () => {
      try {
        setLoading(true);
        const response = await muscleGroupsApi.getAll();
        setMuscleGroups(response.data);
        
        if (response.usingMock) {
          toast({
            title: "Notice",
            description: "Using local muscle group data due to connection issues",
          });
        }
      } catch (error) {
        console.error("Failed to fetch muscle groups:", error);
        toast({
          title: "Error",
          description: "Failed to load muscle groups",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMuscleGroups();
  }, [toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || selectedMuscleGroups.length === 0) return;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let formattedDate = date;
    
    // If date is in DD/MM/YYYY format, convert it to YYYY-MM-DD
    if (date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3) {
        // Assuming DD/MM/YYYY format
        formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    if (!dateRegex.test(formattedDate)) {
      toast({
        title: "Invalid date format",
        description: "Please use YYYY-MM-DD format",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Create workout directly via API - no fallback
      const response = await workoutsApi.create({
        name,
        date: formattedDate,
        targetMuscleGroupIds: selectedMuscleGroups,
        notes,
      });
      
      toast({
        title: "Success",
        description: "Workout created successfully",
      });
      
      navigate(`/workouts/${response.data.id}`);
    } catch (error) {
      console.error("Failed to create workout:", error);
      toast({
        title: "Error",
        description: "Failed to create workout. Please try again when the backend is available.",
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
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center mb-6">
        <Link to="/workouts" className="mr-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold mb-2">New Workout</h1>
          <p className="text-sm text-muted-foreground">
            Create a new workout session
          </p>
        </div>
      </div>
      
      <Card className="card-gradient p-4 rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Workout Name
            </label>
            <Input
              id="name"
              placeholder="e.g., Chest & Triceps"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-muscle-dark/50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="pl-10 bg-muscle-dark/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Muscle Groups</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-muscle-dark/50 border-input"
                >
                  {selectedMuscleGroups.length > 0
                    ? `${selectedMuscleGroups.length} selected`
                    : "Select muscle groups..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-card text-foreground">
                <Command className="bg-transparent">
                  <CommandInput placeholder="Search muscle groups..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No muscle groups found.</CommandEmpty>
                    <CommandGroup>
                      {muscleGroups.map((group) => (
                        <CommandItem
                          key={group.id}
                          value={group.id}
                          onSelect={() => {
                            setSelectedMuscleGroups((prev) =>
                              prev.includes(group.id)
                                ? prev.filter((id) => id !== group.id)
                                : [...prev, group.id]
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMuscleGroups.includes(group.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {group.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedMuscleGroups.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMuscleGroups.map((id) => {
                  const group = muscleGroups.find(g => g.id === id);
                  return group ? (
                    <Badge key={id} variant="secondary" className="bg-muscle-primary/20 text-foreground">
                      {group.name}
                      <button
                        type="button"
                        className="ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedMuscleGroups(prev => prev.filter(i => i !== id))}
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            
            {selectedMuscleGroups.length === 0 && (
              <p className="text-sm text-red-500 mt-2">
                Please select at least one muscle group
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Add any notes about your workout here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muscle-dark/50 min-h-[80px]"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-muscle-primary" 
            disabled={submitting || name.trim() === '' || selectedMuscleGroups.length === 0}
          >
            {submitting ? "Creating..." : "Create Workout"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default NewWorkout;
