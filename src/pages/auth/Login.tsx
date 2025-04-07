import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell, LineChart, ClipboardList, Zap, TrendingUp, Calendar, Bot, Award, Activity, Smartphone, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

const featureItems = [
  {
    icon: <Dumbbell className="w-5 h-5 text-muscle-accent" />,
    title: "Progressive Overload Tracking",
    description: "Log every workout with precision. Track weights, reps, and volume over time to ensure continuous gains."
  },
  {
    icon: <ClipboardList className="w-5 h-5 text-muscle-accent" />,
    title: "Smart Workout Templates",
    description: "Prebuilt workout templates to help you get started. That includes Push, Pull, Legs, and can customize it to your needs."
  },
  {
    icon: <LineChart className="w-5 h-5 text-muscle-accent" />,
    title: "Comprehensive Analytics",
    description: "Visualize your progress with detailed graphs showing strength and muscle growth over weeks and months."
  },
  {
    icon: <Activity className="w-5 h-5 text-muscle-accent" />,
    title: "Performance Insights",
    description: "Get automatic analysis of your workout trends and plateaus to optimize your training."
  },
  
  {
    icon: <Smartphone className="w-5 h-5 text-muscle-accent" />, // Using Smartphone icon instead of Zap for better representation
    title: "Mobile App (Coming Soon)",
    description: "Take your training anywhere with our upcoming iOS and Android apps. Track workouts, view progress, and get recommendations on the go with full sync from web to mobile."
  },
  {
    icon: <Zap className="w-5 h-5 text-muscle-accent" />,
    title: "AI Based Suggestion  (Coming Soon)",
    description: "Get personalized recommendations for exercises, volume, and rest periods based on your progress."
  }
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login, loading } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setErrorMessage("");
    try {
      await login(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        "Unable to connect. Please check your connection."
      );
    }
  };
  
  return (
    <div className="animate-fade-in max-w-xs mx-auto sm:max-w-sm">
      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-muscle-accent to-muscle-primary text-transparent bg-clip-text mb-1">
            MuscleMetrics
          </h1>
          <p className="text-muted-foreground text-sm">
            Your scientific training companion
          </p>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="card-gradient p-5 rounded-xl shadow-lg mb-6"
      >
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Dumbbell className="w-5 h-5" /> Sign In
        </h2>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muscle-dark/50 h-9"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muscle-dark/50 h-9"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-primary mt-2 h-9" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            No account?{" "}
            <Link to="/register" className="text-muscle-accent hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
      
      {/* App Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          MuscleMetrics transforms how athletes train by combining workout tracking with 
          scientific analysis to maximize your results.
        </p>
      </motion.div>

      <div className="flex justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="text-center  mb-6"
      >
        <a
          href="https://forms.gle/CssppT46b16YHCTK6"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button 
            variant="outline" 
            className="text-sm flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Give Feedback
          </Button>
        </a>
      </motion.div>
      </div>
      
      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-4 mb-6"
      >
        <h3 className="font-semibold text-center flex items-center justify-center gap-2 text-sm mb-4">
          <TrendingUp className="w-4 h-4 text-muscle-accent" /> 
          WHY CHOOSE MUSCLEMETRICS?
        </h3>
        
        <div className="space-y-3">
          {featureItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-muscle-dark/10 rounded-lg border border-muscle-dark/20"
            >
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div>
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      
      
      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="text-center text-xs text-muted-foreground mb-4"
      >
        <p>Join thousands of athletes making consistent gains with data-driven training</p>
      </motion.div>
    </div>
  );
};

export default Login;