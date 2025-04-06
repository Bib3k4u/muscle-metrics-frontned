import { useState, useEffect } from "react";
import { workoutsApi } from "@/services/api";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Search, Dumbbell, Plus, Filter, ChevronDown, Copy, PlusSquare, ArrowRight, ArrowDownUp, Database, RefreshCw, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Workout {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: Array<any>;
  pendingSync?: boolean;
}

const WorkoutList = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  const [usingLocalData, setUsingLocalData] = useState(false);
  const [hasPendingSyncs, setHasPendingSyncs] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        try {
          const response = await workoutsApi.getAll();
          
          // Check if we have any local workouts pending sync
          const pendingSyncs = response.data.some((workout: Workout) => workout.pendingSync);
          setHasPendingSyncs(pendingSyncs);
          
          setWorkouts(response.data);
          setFilteredWorkouts(response.data);
          setUsingLocalData(!!response.usingMock);
        } catch (apiError) {
          console.error("Failed to fetch workouts from API:", apiError);
          
          // Try to load workouts from localStorage as fallback
          const storedWorkouts = localStorage.getItem('muscle-metrics-workouts');
          if (storedWorkouts) {
            const localWorkouts = JSON.parse(storedWorkouts);
            
            // Check if we have any pendingSyncs
            const pendingSyncs = localWorkouts.some((workout: Workout) => workout.pendingSync);
            setHasPendingSyncs(pendingSyncs);
            
            setWorkouts(localWorkouts);
            setFilteredWorkouts(localWorkouts);
            setUsingLocalData(true);
            console.log("Using locally stored workouts");
          } else {
            // If no local workouts, set empty array
            setWorkouts([]);
            setFilteredWorkouts([]);
            setUsingLocalData(true);
          }
        }
      } catch (error) {
        console.error("Error handling workouts:", error);
        setWorkouts([]);
        setFilteredWorkouts([]);
        setUsingLocalData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkouts();
  }, []);
  
  useEffect(() => {
    let result = [...workouts];
    
    // Apply search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(workout => 
        workout.name.toLowerCase().includes(search) ||
        (workout.targetMuscleGroups && workout.targetMuscleGroups.some(group => 
          group.name.toLowerCase().includes(search)
        ))
      );
    }
    
    // Apply sorting
    result = result.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    
    setFilteredWorkouts(result);
  }, [workouts, searchTerm, sortOrder]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return dateString;
    }
  };
  
  const syncAllPendingWorkouts = async () => {
    if (!hasPendingSyncs) return;
    
    setIsSyncing(true);
    try {
      const result = await workoutsApi.syncPendingWorkouts();
      
      if (result.synced > 0) {
        toast({
          title: "Success",
          description: `Synced ${result.synced} workout${result.synced !== 1 ? 's' : ''} to the database`,
        });
        
        // Refresh the workouts list
        const response = await workoutsApi.getAll();
        setWorkouts(response.data);
        setFilteredWorkouts(response.data);
        
        // Check if we still have any pending syncs
        const pendingSyncs = response.data.some((workout: Workout) => workout.pendingSync);
        setHasPendingSyncs(pendingSyncs);
      } else {
        toast({
          title: "Info",
          description: "No workouts were synced to the database",
        });
      }
    } catch (error) {
      console.error("Failed to sync workouts:", error);
      toast({
        title: "Error",
        description: "Failed to sync workouts to the database",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold mb-2">Workouts</h1>
          <p className="text-muted-foreground text-sm">
            Your workout history
          </p>
        </div>
        <div className="flex space-x-2">
          <Link to="/workout-templates">
            <Button variant="outline" className="bg-card">
              <Copy className="h-4 w-4 mr-1" /> Templates
            </Button>
          </Link>
          <Link to="/workouts/new">
            <Button className="bg-muscle-primary">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </Link>
        </div>
      </div>
      
      {usingLocalData && (
        <Card className="card-gradient p-3 rounded-xl mb-5 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-amber-400 mr-2" />
            <p className="text-sm text-amber-300">
              <span className="font-medium">Demo Mode:</span> Using locally stored workouts. Your workout data will persist in your browser.
            </p>
          </div>
        </Card>
      )}
      
      {hasPendingSyncs && (
        <Card className="card-gradient p-3 rounded-xl mb-5 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-blue-400 mr-2" />
              <p className="text-sm text-blue-300">
                <span className="font-medium">Sync Status:</span> You have workouts that need to be saved to the database.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
              onClick={syncAllPendingWorkouts}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              )}
              Sync All
            </Button>
          </div>
        </Card>
      )}
      
      {workouts.length > 0 && (
        <Card className="card-gradient p-4 rounded-xl mb-6 bg-card/50">
          <div className="flex justify-between items-center mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search workouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muscle-dark/50"
              />
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant={sortOrder === "newest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("newest")}
                className={sortOrder === "newest" ? "bg-muscle-primary" : ""}
              >
                Newest
              </Button>
              <Button
                variant={sortOrder === "oldest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("oldest")}
                className={sortOrder === "oldest" ? "bg-muscle-primary" : ""}
              >
                Oldest
              </Button>
              <Button
                variant={sortOrder === "name" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortOrder("name")}
                className={sortOrder === "name" ? "bg-muscle-primary" : ""}
              >
                Name
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredWorkouts.length > 0 ? (
        <div className="space-y-4">
          {filteredWorkouts.map((workout) => (
            <Link to={`/workouts/${workout.id}`} key={workout.id}>
              <Card className="p-4 rounded-xl card-gradient hover:bg-card/80 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{workout.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(workout.date)}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {workout.targetMuscleGroups && workout.targetMuscleGroups.map((group) => (
                        <Badge 
                          key={group.id}
                          className="bg-muscle-primary/20 text-muscle-accent"
                        >
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {workout.pendingSync && (
                      <Badge className="bg-blue-500/20 text-blue-400 mr-2">
                        <Database className="h-3 w-3 mr-1" />
                        Local Only
                      </Badge>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          {searchTerm ? (
            <p className="text-muted-foreground">
              No workouts found matching "{searchTerm}"
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                You haven't created any workouts yet.
              </p>
              <Link to="/workouts/new">
                <Button className="bg-muscle-primary">
                  <Plus className="h-4 w-4 mr-1" /> Create Your First Workout
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
      
      {workouts.length > 0 && (
        <Card className="card-gradient p-4 rounded-xl mt-6 bg-card/50">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Ready-made Workout Templates</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Try our 6-day push/pull/legs split with pre-populated exercises, sets and reps.
            </p>
            <Link to="/workout-templates">
              <Button className="bg-muscle-primary w-full sm:w-auto">
                <Copy className="h-4 w-4 mr-1" /> View Templates
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkoutList;
