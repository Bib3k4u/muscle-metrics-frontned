import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ExerciseDetails: React.FC = () => {
  const exercise = {
    name: 'Exercise Name',
    muscleGroups: [
      { id: '1', name: 'Muscle Group 1' },
      { id: '2', name: 'Muscle Group 2' },
    ],
  };

  return (
    <div className="flex items-center mb-6">
      <Link to="/exercises" className="mr-2">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="text-xl font-bold mb-2">{exercise.name}</h1>
        <div className="flex flex-wrap gap-2">
          {exercise.muscleGroups?.map((group) => (
            <Badge 
              key={group.id}
              className="bg-muscle-primary/20 text-muscle-accent"
            >
              {group.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetails; 