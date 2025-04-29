
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <Button asChild size="lg">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
