
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export const LeaderboardSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get the beginning of the current week (Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Call the edge function to get weekly XP
        const { data, error } = await supabase.functions.invoke("get-weekly-xp", {
          body: { 
            userId: user.id, 
            startDate: startOfWeek.toISOString()
          }
        });
        
        if (error) {
          console.error("Error fetching weekly XP:", error);
        } else if (data) {
          setWeeklyXp(data.xp || 0);
          setStreak(data.streak || 0);
        }
      } catch (err) {
        console.error("Failed to fetch weekly data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">XP This Week</p>
              <p className="text-2xl font-bold">{weeklyXp} XP</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{streak} days</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
