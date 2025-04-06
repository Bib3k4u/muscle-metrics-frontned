import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { workoutsApi } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Filter, BarChart2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
}

interface VolumeData {
  date: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  sets: number;
  totalVolume: number;
}

const VolumeProgressChart = () => {
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const { toast } = useToast();

  // Fetch all exercises for the dropdown
  useEffect(() => {
    const fetchExercises = async () => {
      setLoadingExercises(true);
      try {
        // Get recent workouts to extract exercise templates
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        // Fetch workouts from API
        const response = await workoutsApi.getByDateRange(startDate, endDate);
        
        // Extract unique exercise templates
        const uniqueExercises = new Map<string, Exercise>();
        
        response.data.forEach((workout: any) => {
          if (workout.exercises) {
            workout.exercises.forEach((exercise: any) => {
              if (exercise.exerciseTemplate && !uniqueExercises.has(exercise.exerciseTemplate.id)) {
                uniqueExercises.set(exercise.exerciseTemplate.id, {
                  id: exercise.exerciseTemplate.id,
                  name: exercise.exerciseTemplate.name
                });
              }
            });
          }
        });
        
        const exercisesList = Array.from(uniqueExercises.values());
        exercisesList.sort((a, b) => a.name.localeCompare(b.name));
        
        setExercises(exercisesList);
        
        // If exercises are found, select the first one by default
        if (exercisesList.length > 0) {
          setSelectedExerciseId(exercisesList[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exercise data. Please try again later.',
          variant: 'destructive',
        });
        setExercises([]);
      } finally {
        setLoadingExercises(false);
      }
    };
    
    fetchExercises();
  }, [toast]);

  // Fetch volume data when exercise selection or time range changes
  useEffect(() => {
    const fetchVolumeHistory = async () => {
      if (!selectedExerciseId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const startDate = getStartDateForRange(timeRange);
        const response = await workoutsApi.getExerciseHistory(selectedExerciseId, startDate);
        
        // Format the data for the chart
        const formattedData = response.data.map((item: VolumeData) => ({
          date: format(new Date(item.date), 'MMM dd'),
          rawDate: item.date,
          volume: item.totalVolume,
          workoutName: item.workoutName,
          sets: item.sets,
          workoutId: item.workoutId
        }));
        
        setVolumeData(formattedData);
      } catch (error) {
        console.error('Failed to fetch exercise volume history:', error);
        setError('Could not load volume history. Check your internet connection and try again.');
        setVolumeData([]);
        
        toast({
          title: 'Error',
          description: 'Failed to load volume data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedExerciseId) {
      fetchVolumeHistory();
    }
  }, [selectedExerciseId, timeRange, toast]);

  const getStartDateForRange = (range: '1m' | '3m' | '6m' | '1y'): string => {
    const date = new Date();
    switch (range) {
      case '1m':
        date.setMonth(date.getMonth() - 1);
        break;
      case '3m':
        date.setMonth(date.getMonth() - 3);
        break;
      case '6m':
        date.setMonth(date.getMonth() - 6);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 bg-card border border-muscle-primary/30">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.workoutName}</p>
          <p className="text-sm text-muscle-accent">
            Volume: {payload[0].value.toFixed(1)} kg
          </p>
          <p className="text-xs text-muted-foreground">
            Sets: {payload[0].payload.sets}
          </p>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-muscle-accent mr-2" />
          <h2 className="text-xl font-semibold">Volume Progress</h2>
        </div>
      </div>
      
      <Card className="card-gradient p-4 rounded-xl">
        <div className="flex flex-col mb-4 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-2 flex items-center">
              <Filter className="h-4 w-4 mr-1" /> Exercise
            </label>
            <Select
              value={selectedExerciseId}
              onValueChange={setSelectedExerciseId}
              disabled={loadingExercises}
            >
              <SelectTrigger className="w-full bg-muscle-dark/20">
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2 flex items-center">
              <BarChart2 className="h-4 w-4 mr-1" /> Time Range
            </label>
            <div className="flex space-x-1">
              <Button
                variant={timeRange === '1m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('1m')}
                className={timeRange === '1m' ? 'bg-muscle-primary' : ''}
              >
                1M
              </Button>
              <Button
                variant={timeRange === '3m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('3m')}
                className={timeRange === '3m' ? 'bg-muscle-primary' : ''}
              >
                3M
              </Button>
              <Button
                variant={timeRange === '6m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('6m')}
                className={timeRange === '6m' ? 'bg-muscle-primary' : ''}
              >
                6M
              </Button>
              <Button
                variant={timeRange === '1y' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('1y')}
                className={timeRange === '1y' ? 'bg-muscle-primary' : ''}
              >
                1Y
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muscle-accent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 h-[250px] flex items-center justify-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : volumeData.length === 0 ? (
          <div className="text-center py-8 h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">No volume history available for this exercise.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#9ca3af' }} 
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#9ca3af' }} 
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="volume" 
                name="Volume (kg)" 
                fill="#6b46c1" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};

export default VolumeProgressChart; 