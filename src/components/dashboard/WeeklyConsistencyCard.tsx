
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, CalendarCheck, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";

export const WeeklyConsistencyCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState({
    completedTasks: 0,
    totalTasks: 7, // Assuming 7 days a week
    currentStreak: 0,
    bestStreak: 0,
    weeklyXP: 0
  });

  useEffect(() => {
    const fetchConsistencyData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get completed tasks this week
        const startOfWeek = subDays(new Date(), 7);
        const { data: completedReminders, error: remindersError } = await supabase
          .from('reminders')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('updated_at', startOfWeek.toISOString());
          
        if (remindersError) throw remindersError;
        
        // Get XP gained this week
        const { data: xpData, error: xpError } = await supabase
          .from('xp_events')
          .select('amount')
          .eq('user_id', user.id)
          .gte('created_at', startOfWeek.toISOString());
          
        if (xpError) throw xpError;
        
        // Get streak information from progress tracking
        const { data: progressData, error: progressError } = await supabase
          .from('progress_tracking')
          .select('streak_days, last_activity_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (progressError) throw progressError;
        
        // Calculate current streak
        let currentStreak = 0;
        
        if (progressData && progressData.last_activity_date) {
          const lastActivity = new Date(progressData.last_activity_date);
          const today = new Date();
          
          // If last activity is today or yesterday, streak is active
          const daysSinceLastActivity = differenceInDays(today, lastActivity);
          if (daysSinceLastActivity <= 1) {
            currentStreak = progressData.streak_days || 0;
          }
        }
        
        // Calculate total XP gained this week
        const weeklyXP = xpData ? xpData.reduce((sum, event) => sum + event.amount, 0) : 0;
        
        setWeeklyData({
          completedTasks: completedReminders ? completedReminders.length : 0,
          totalTasks: 7,
          currentStreak,
          bestStreak: currentStreak, // For now, just use current streak
          weeklyXP
        });
      } catch (error) {
        console.error("Error fetching consistency data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConsistencyData();
  }, [user]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Calculate completion percentage
  const completionPercentage = Math.min(100, (weeklyData.completedTasks / weeklyData.totalTasks) * 100);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-socialmize-purple" />
              <span className="font-medium">Tasks Completed</span>
            </div>
            <span className="text-sm">{weeklyData.completedTasks}/{weeklyData.totalTasks}</span>
          </div>
          
          <Progress value={completionPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-socialmize-orange" />
              <div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="font-bold">{weeklyData.currentStreak} days</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-socialmize-purple" />
              <div>
                <div className="text-sm text-muted-foreground">Weekly XP</div>
                <div className="font-bold">{weeklyData.weeklyXP} XP</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
