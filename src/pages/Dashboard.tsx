import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { StrategySection } from "@/components/dashboard/StrategySection";
import { ScriptsSection } from "@/components/dashboard/ScriptsSection";
import { ProfileSection } from "@/components/dashboard/ProfileSection";
import { StrategyData, ProgressData } from "@/types/dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
        // Try to fetch strategy from database
        const { data: strategyData, error: strategyError } = await supabase
          .from('strategy_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (strategyError) {
          console.error("Error fetching strategy:", strategyError);
        }
        
        // If strategy exists in database, use it
        if (strategyData) {
          setStrategy({
            experience_level: strategyData.experience_level,
            content_types: strategyData.content_types as string[],
            weekly_calendar: strategyData.weekly_calendar as Record<string, string[]>,
            starter_scripts: strategyData.first_five_scripts as { title: string; script: string }[]
          });
        } else {
          // Otherwise, try to use localStorage as fallback
          const storedStrategy = localStorage.getItem('userStrategy');
          if (storedStrategy) {
            try {
              setStrategy(JSON.parse(storedStrategy));
            } catch (error) {
              console.error("Error parsing strategy from localStorage:", error);
            }
          }
        }
        
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('progress_tracking')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (progressError) {
          console.error("Error fetching progress:", progressError);
        } else if (progressData) {
          setProgress({
            current_xp: progressData.current_xp || 0,
            current_level: progressData.current_level || 1,
            streak_days: progressData.streak_days || 0,
            last_activity_date: progressData.last_activity_date || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading your dashboard data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to your Creator Dashboard</h1>
        
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="scripts">Content Scripts</TabsTrigger>
            <TabsTrigger value="profile">Creator Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategy">
            <StrategySection strategy={strategy} loading={loading} />
          </TabsContent>
          
          <TabsContent value="scripts">
            <ScriptsSection strategy={strategy} loading={loading} />
          </TabsContent>
          
          <TabsContent value="profile">
            <ProfileSection user={user} progress={progress} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
