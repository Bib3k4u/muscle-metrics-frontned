import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { register, loading } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordError("");
    setErrorMessage("");
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    
    // Validate required fields
    if (!username || !email || !password) {
      setErrorMessage("All fields are required");
      return;
    }
    
    // Add basic validation for email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    
    try {
      console.log("Attempting to register with:", { username, email });
      const result = await register(username, email, password);
      console.log("Registration successful:", result);
      
      // Navigate to home on successful registration
      navigate("/");
    } catch (err: any) {
      console.error("Registration error:", err);
      console.error("Server response:", err.response?.data);
      
      // Extract and display specific error message from server response
      let errorMsg = "Registration failed. Please try again.";
      
      if (err.response) {
        // The server responded with an error status
        if (err.response.data && err.response.data.error) {
          errorMsg = err.response.data.error;
          // Check for common errors
          if (errorMsg.includes("Email is already in use")) {
            errorMsg = "This email is already registered. Please use a different email or log in.";
          } else if (errorMsg.includes("Username is already taken")) {
            errorMsg = "This username is already taken. Please choose a different username.";
          }
        } else if (err.response.status === 500) {
          errorMsg = "Server error. Please try a different email address or username.";
        }
      }
      
      setErrorMessage(errorMsg);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-muscle-accent to-muscle-primary text-transparent bg-clip-text mb-2">
          MuscleMetrics
        </h1>
        <p className="text-muted-foreground">
          Create your account to start tracking
        </p>
      </div>
      
      <div className="card-gradient p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Sign Up</h2>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-muscle-dark/50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muscle-dark/50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muscle-dark/50"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-muscle-dark/50"
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-muscle-accent hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
