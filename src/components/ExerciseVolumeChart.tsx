import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { workoutsApi } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface ExerciseVolumeChartProps {
  exerciseTemplateId: string;
  exerciseName: string;
}

interface VolumeData {
  date: string;
  workoutId: string;
  workoutName: string;
  exerciseId: string;
  sets: number;
  totalVolume: number;
}

const ExerciseVolumeChart = ({ exerciseTemplateId, exerciseName }: ExerciseVolumeChartProps) => {
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const { toast } = useToast();

  useEffect(() => {
    const fetchVolumeHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = getStartDateForRange(timeRange);
        const response = await workoutsApi.getExerciseHistory(exerciseTemplateId, startDate);
        
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
        setError('Could not load volume history');
        toast({
          title: 'Error',
          description: 'Failed to load exercise volume history',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeHistory();
  }, [exerciseTemplateId, timeRange, toast]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muscle-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (volumeData.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No volume history data available for this exercise.</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Volume History</h3>
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

      <Card className="p-4 card-gradient">
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
      </Card>
    </div>
  );
};

export default ExerciseVolumeChart; 