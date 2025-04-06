
import { Home, Dumbbell, Calendar, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNavbar = () => {
  return (
    <nav className="bottom-nav">
      <div className="flex justify-between items-center">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? "active" : ""}`
          }
          end
        >
          <Home className="h-6 w-6 mb-1" />
          <span className="text-xs">Home</span>
        </NavLink>
        
        <NavLink 
          to="/exercises" 
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? "active" : ""}`
          }
        >
          <Dumbbell className="h-6 w-6 mb-1" />
          <span className="text-xs">Exercises</span>
        </NavLink>
        
        <NavLink 
          to="/workouts" 
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? "active" : ""}`
          }
        >
          <Calendar className="h-6 w-6 mb-1" />
          <span className="text-xs">Workouts</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? "active" : ""}`
          }
        >
          <User className="h-6 w-6 mb-1" />
          <span className="text-xs">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavbar;
