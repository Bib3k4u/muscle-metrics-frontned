import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { workoutsApi } from "@/services/api";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Dumbbell, Calendar, ChevronRight, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import VolumeProgressChart from "@/components/VolumeProgressChart";

interface Workout {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  targetMuscleGroups: Array<{ id: string; name: string }>;
  exercises: Array<any>;
}

const Home = () => {
  const { user } = useAuth();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentWorkouts = async () => {
      try {
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        const startDate = oneMonthAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        const response = await workoutsApi.getByDateRange(startDate, endDate);
        
        const workoutsWithDayOfWeek = response.data.map((workout: Workout) => {
          if (!workout.dayOfWeek) {
            const date = new Date(workout.date);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            workout.dayOfWeek = days[date.getDay()];
          }
          return workout;
        });
        
        const sortedWorkouts = workoutsWithDayOfWeek.sort((a: Workout, b: Workout) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setRecentWorkouts(sortedWorkouts.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch recent workouts:", error);
        // Do not use mock data, just set empty array
        setRecentWorkouts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentWorkouts();
  }, []);
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-muscle-accent to-muscle-primary text-transparent bg-clip-text mb-2">
            MuscleMetrics
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="card-gradient p-4 rounded-xl flex flex-col items-center">
          <div className="bg-muscle-primary/20 rounded-full p-3 mb-2">
            <Dumbbell className="h-6 w-6 text-muscle-accent" />
          </div>
          <h3 className="font-medium">Start Workout</h3>
          <Link to="/workouts/new" className="mt-2">
            <Button size="sm" className="bg-muscle-primary text-white">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </Link>
        </Card>
        
        <Card className="card-gradient p-4 rounded-xl flex flex-col items-center">
          <div className="bg-muscle-primary/20 rounded-full p-3 mb-2">
            <TrendingUp className="h-6 w-6 text-muscle-accent" />
          </div>
          <h3 className="font-medium">Progress</h3>
          <Link to="/workouts" className="mt-2">
            <Button size="sm" variant="secondary">
              View
            </Button>
          </Link>
        </Card>
      </div>
      
      <VolumeProgressChart />
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Recent Workouts</h2>
          <Link 
            to="/workouts" 
            className="text-muscle-accent text-sm flex items-center"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muscle-accent"></div>
          </div>
        ) : recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => (
              <Link to={`/workouts/${workout.id}`} key={workout.id}>
                <Card className="card-gradient p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{workout.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {workout.targetMuscleGroups.map(mg => mg.name).join(', ')}
                      </div>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(workout.date)} • {workout.dayOfWeek.charAt(0) + workout.dayOfWeek.slice(1).toLowerCase()}
                      </div>
                    </div>
                    <div className="bg-muscle-primary/10 py-2 px-3 rounded-md">
                      <span className="text-muscle-accent font-medium">
                        {workout.exercises.length}
                      </span>
                      <span className="text-xs ml-1 text-muted-foreground">
                        exercises
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="card-gradient p-6 rounded-xl text-center">
            <p className="text-muted-foreground mb-4">No recent workouts found.</p>
            <Link to="/workouts/new">
              <Button className="bg-muscle-primary text-white">
                Create Your First Workout
              </Button>
            </Link>
          </Card>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Suggestions</h2>
        </div>
        <Card className="card-gradient p-4 rounded-xl">
          <div className="flex items-center space-x-4">
            <div className="bg-muscle-primary/20 rounded-full p-3">
              <Dumbbell className="h-5 w-5 text-muscle-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Explore Exercise Library</h3>
              <p className="text-sm text-muted-foreground">
                Find new exercises for your routine
              </p>
            </div>
            <Link to="/exercises">
              <Button size="sm" variant="ghost" className="text-muscle-accent">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
