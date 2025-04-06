
import { Outlet } from "react-router-dom";
import BottomNavbar from "./BottomNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muscle-accent" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="mobile-container">
      <Outlet />
      <BottomNavbar />
    </div>
  );
};

export default AppLayout;
