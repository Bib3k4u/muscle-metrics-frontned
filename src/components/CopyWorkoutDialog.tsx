import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { workoutsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CopyWorkoutDialogProps {
  workoutId: string;
  workoutName: string;
  isOpen: boolean;
  onClose: () => void;
}

const CopyWorkoutDialog = ({ workoutId, workoutName, isOpen, onClose }: CopyWorkoutDialogProps) => {
  const [newDate, setNewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isCopying, setIsCopying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopyWorkout = async () => {
    if (!newDate) return;
    
    setIsCopying(true);
    try {
      const response = await workoutsApi.copyWorkout(workoutId, newDate);
      
      toast({
        title: 'Success',
        description: `Workout copied to ${format(new Date(newDate), 'MMM dd, yyyy')}`,
      });
      
      // Navigate to the new workout
      navigate(`/workouts/${response.data.id}`);
    } catch (error) {
      console.error('Failed to copy workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy the workout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Copy Workout</DialogTitle>
          <DialogDescription>
            Create a copy of "{workoutName}" for a new date. All exercises, sets, reps, and weights will be copied.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">New Date</label>
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
        
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">Tip:</span> After copying, you can modify the sets, reps, and weights as needed.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCopying}
          >
            Cancel
          </Button>
          <Button 
            className="bg-muscle-primary"
            onClick={handleCopyWorkout}
            disabled={!newDate || isCopying}
          >
            {isCopying ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy Workout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyWorkoutDialog; 