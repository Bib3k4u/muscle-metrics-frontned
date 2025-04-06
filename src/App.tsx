import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// App Pages
import Home from "./pages/Home";
import WorkoutList from "./pages/workouts/WorkoutList";
import WorkoutDetails from "./pages/workouts/WorkoutDetails";
import NewWorkout from "./pages/workouts/NewWorkout";
import AddExercise from "./pages/workouts/AddExercise";
import WorkoutTemplates from "./pages/workouts/WorkoutTemplates";
import NewWorkoutTemplate from "./pages/workouts/NewWorkoutTemplate";
import ExerciseList from "./pages/exercises/ExerciseList";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            
            {/* App Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/workouts" element={<WorkoutList />} />
              <Route path="/workouts/new" element={<NewWorkout />} />
              <Route path="/workouts/:id/add-exercise" element={<AddExercise />} />
              <Route path="/workouts/:id" element={<WorkoutDetails />} />
              <Route path="/workout-templates" element={<WorkoutTemplates />} />
              <Route path="/workout-templates/new" element={<NewWorkoutTemplate />} />
              <Route path="/exercises" element={<ExerciseList />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Catch-all Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
