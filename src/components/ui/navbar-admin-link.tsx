
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function NavbarAdminLink() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);
  
  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user?.id });
      
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  if (!isAdmin) return null;
  
  return (
    <Link to="/admin">
      <Button variant="outline" size="sm" className="gap-1">
        <Shield className="h-4 w-4" />
        <span className="hidden md:inline">Admin</span>
      </Button>
    </Link>
  );
}
