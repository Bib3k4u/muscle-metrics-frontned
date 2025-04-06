import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Lock, 
  LogOut,
  Calendar,
  Weight,
  Ruler,
  Edit,
  Save,
  X,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setWeight(user.weight);
      setHeight(user.height);
    }
  }, [user]);
  
  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [newPassword, confirmPassword]);
  
  const handleSaveProfile = async () => {
    if (!username) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({
        username,
        weight: weight || null,
        height: height || null,
      });
      
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    if (user) {
      setUsername(user.username || "");
      setWeight(user.weight);
      setHeight(user.height);
    }
    setIsEditing(false);
  };
  
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account settings
          </p>
        </div>
        <Button 
          variant="destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1" /> Logout
        </Button>
      </div>
      
      <Card className="card-gradient p-6 rounded-xl mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-muscle-primary/20 rounded-full p-4 mr-4">
              <User className="h-6 w-6 text-muscle-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user?.username}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
          
          <div className="self-start md:self-center">
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-muscle-accent text-muscle-accent"
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button 
                  className="bg-muscle-primary"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {!isEditing ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-muscle-dark/20 rounded-lg">
                <User className="h-5 w-5 text-muscle-accent mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{user?.username}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-muscle-dark/20 rounded-lg">
                <Mail className="h-5 w-5 text-muscle-accent mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-muscle-dark/20 rounded-lg">
                <Weight className="h-5 w-5 text-muscle-accent mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{user?.weight ? `${user.weight} kg` : "Not set"}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-muscle-dark/20 rounded-lg">
                <Ruler className="h-5 w-5 text-muscle-accent mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">{user?.height ? `${user.height} cm` : "Not set"}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-muscle-dark/20 rounded-lg">
                <Calendar className="h-5 w-5 text-muscle-accent mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium mb-3">Edit Profile</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-1" /> Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-muscle-dark/50 w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Mail className="h-4 w-4 mr-1" /> Email (cannot be changed)
              </label>
              <Input
                value={user?.email || ""}
                readOnly
                disabled
                className="bg-muscle-dark/50 opacity-70 w-full"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Weight className="h-4 w-4 mr-1" /> Weight (kg)
                </label>
                <Input
                  type="number"
                  value={weight || ""}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-muscle-dark/50 w-full"
                  placeholder="Enter your weight"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Ruler className="h-4 w-4 mr-1" /> Height (cm)
                </label>
                <Input
                  type="number"
                  value={height || ""}
                  onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-muscle-dark/50 w-full"
                  placeholder="Enter your height"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
      
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      
      <Card className="card-gradient p-4 rounded-xl mb-6">
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start py-4">
              <Lock className="h-5 w-5 mr-3" />
              <span>Change Password</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card text-foreground">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new password to update your credentials.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-muscle-dark/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-muscle-dark/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-muscle-dark/50"
                />
              </div>
              
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setChangePasswordOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError("");
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-muscle-primary" 
                onClick={handleChangePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
};

export default Profile;