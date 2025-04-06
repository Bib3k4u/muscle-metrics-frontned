import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

interface NotFoundWithReturnProps {
  returnPath: string;
  returnLabel: string;
}

const NotFoundWithReturn = ({ returnPath, returnLabel }: NotFoundWithReturnProps) => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="p-4 animate-fade-in">
      <Card className="card-gradient p-6 rounded-xl max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-muscle-primary/20 text-muscle-accent flex items-center justify-center rounded-full mx-auto mb-6">
          <span className="text-4xl font-bold">404</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Oops! Page not found</h1>
        
        <p className="text-muted-foreground mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col space-y-2">
          <Link to={returnPath}>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnLabel}
            </Button>
          </Link>
          
          <Link to="/">
            <Button className="w-full bg-muscle-primary">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFoundWithReturn; 