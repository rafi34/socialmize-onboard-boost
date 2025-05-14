
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StrategyContextType {
  threadId: string | null;
  deepProfile: Record<string, any> | null;
  contentIdeas: Array<any>;
  missionMap: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  refreshStrategyData: () => Promise<void>;
  saveDeepProfile: (data: Record<string, any>) => Promise<void>;
  saveMissionMap: (data: Record<string, any>) => Promise<void>;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [deepProfile, setDeepProfile] = useState<Record<string, any> | null>(null);
  const [contentIdeas, setContentIdeas] = useState<Array<any>>([]);
  const [missionMap, setMissionMap] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStrategyData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch thread ID
      const { data: threadData, error: threadError } = await supabase
        .from('assistant_threads')
        .select('thread_id')
        .eq('user_id', user.id)
        .eq('purpose', 'strategy')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (threadError) throw threadError;
      
      if (threadData?.thread_id) {
        setThreadId(threadData.thread_id);
      }
      
      // Check if strategy_deep_profile exists using RPC instead of directly querying the table
      try {
        // Try to fetch deep profile data 
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_strategy_deep_profile', { user_id_param: user.id })
          .maybeSingle();
        
        if (!profileError && profileData) {
          setDeepProfile(profileData.data || {});
        }
      } catch (err) {
        console.log("Strategy deep profile table might not exist yet:", err);
      }
      
      // Try to fetch mission map data
      try {
        const { data: missionData, error: missionError } = await supabase
          .rpc('get_mission_map_plan', { user_id_param: user.id })
          .maybeSingle();
        
        if (!missionError && missionData) {
          setMissionMap(missionData.data || {});
        }
      } catch (err) {
        console.log("Mission map plans table might not exist yet:", err);
      }
      
      // Fetch content ideas
      const { data: ideasData, error: ideasError } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });
      
      if (ideasError) throw ideasError;
      
      if (ideasData) {
        setContentIdeas(ideasData);
      }
    } catch (err: any) {
      console.error("Error fetching strategy data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const saveDeepProfile = async (data: Record<string, any>) => {
    if (!user) return;
    
    try {
      // First, invoke the function to create the table if it doesn't exist
      await supabase.functions.invoke('create-strategy-tables', {
        body: { createDeepProfile: true }
      });
      
      // Then insert data using RPC
      const { error } = await supabase.rpc('save_strategy_deep_profile', {
        user_id_param: user.id,
        data_param: data
      });
        
      if (error) throw error;
      
      setDeepProfile(data);
    } catch (err: any) {
      console.error("Error saving deep profile:", err);
      throw err;
    }
  };
  
  const saveMissionMap = async (data: Record<string, any>) => {
    if (!user) return;
    
    try {
      // First, invoke the function to create the table if it doesn't exist
      await supabase.functions.invoke('create-strategy-tables', {
        body: { createMissionMap: true }
      });
      
      // Then insert data using RPC
      const { error } = await supabase.rpc('save_mission_map_plan', {
        user_id_param: user.id,
        data_param: data
      });
        
      if (error) throw error;
      
      setMissionMap(data);
    } catch (err: any) {
      console.error("Error saving mission map:", err);
      throw err;
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchStrategyData();
    }
  }, [user]);
  
  return (
    <StrategyContext.Provider
      value={{
        threadId,
        deepProfile,
        contentIdeas,
        missionMap,
        loading,
        error,
        refreshStrategyData: fetchStrategyData,
        saveDeepProfile,
        saveMissionMap
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

export const useStrategy = () => {
  const context = useContext(StrategyContext);
  if (context === undefined) {
    throw new Error("useStrategy must be used within a StrategyProvider");
  }
  return context;
};
