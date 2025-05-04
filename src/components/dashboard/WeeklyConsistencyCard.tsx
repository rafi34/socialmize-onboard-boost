
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Flame } from "lucide-react";

export const WeeklyConsistencyCard = () => {
  const [weeklyXp, setWeeklyXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
  const weekStart = new Date(today.setDate(diff));
  
  useEffect(() => {
    if (user) {
      fetchWeeklyXp();
    }
  }, [user]);

  const fetchWeeklyXp = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-weekly-xp', {
        body: { 
          userId: user.id,
          startDate: weekStart.toISOString()
        }
      });
      
      if (error) throw error;
      
      setWeeklyXp(data?.xp || 0);
      setStreak(data?.streak || 0);
    } catch (err) {
      console.error('Error fetching weekly XP:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Weekly Consistency
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Weekly XP</span>
                <span className="text-sm">{weeklyXp} / 100 XP</span>
              </div>
              <Progress value={(weeklyXp / 100) * 100} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-orange-500" />
              <span>Current Streak: {streak} days</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
