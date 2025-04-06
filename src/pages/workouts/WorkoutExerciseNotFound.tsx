import { useParams } from "react-router-dom";
import NotFoundWithReturn from "./NotFoundWithReturn";

const WorkoutExerciseNotFound = () => {
  const { id } = useParams<{ id: string }>();
  const workoutId = id || '';
  
  return (
    <NotFoundWithReturn 
      returnPath={`/workouts/${workoutId}`} 
      returnLabel="Return to Workout"
    />
  );
};

export default WorkoutExerciseNotFound; 