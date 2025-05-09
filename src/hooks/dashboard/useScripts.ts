
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { GeneratedScript } from "@/types/dashboard";

export function useScripts() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScripts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      if (data) setScripts(data as GeneratedScript[]);
    } catch (err) {
      console.error("Error fetching scripts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScripts();
  }, [user, fetchScripts]);

  return {
    scripts,
    loading,
    fetchScripts
  };
}
