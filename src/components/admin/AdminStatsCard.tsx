
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Sparkles, 
  Calendar, 
  FileText,
  Flame
} from "lucide-react";

export function AdminStatsCard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScripts: 0,
    activeStrategies: 0,
    avgXP: 0,
    avgLevel: 0,
    highestStreak: 0,
    todayReminders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get total users count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      if (userError) throw userError;
      
      // Get total scripts count
      const { count: scriptCount, error: scriptError } = await supabase
        .from('generated_scripts')
        .select('*', { count: 'exact', head: true });
        
      if (scriptError) throw scriptError;
      
      // Get active strategies count
      const { count: strategyCount, error: strategyError } = await supabase
        .from('strategy_profiles')
        .select('*', { count: 'exact', head: true });
        
      if (strategyError) throw strategyError;
      
      // Get progress data for XP and level averages
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('current_xp, current_level, streak_days')
        .order('updated_at', { ascending: false });
        
      if (progressError) throw progressError;
      
      // Calculate averages
      let totalXP = 0;
      let totalLevel = 0;
      let maxStreak = 0;
      
      if (progressData && progressData.length > 0) {
        // Use Map to get latest progress entry per user
        const latestProgressByUser = new Map();
        
        progressData.forEach(entry => {
          if (!latestProgressByUser.has(entry.user_id)) {
            latestProgressByUser.set(entry.user_id, entry);
            totalXP += entry.current_xp || 0;
            totalLevel += entry.current_level || 1;
            maxStreak = Math.max(maxStreak, entry.streak_days || 0);
          }
        });
        
        const uniqueUserCount = latestProgressByUser.size || 1;
        totalXP = Math.round(totalXP / uniqueUserCount);
        totalLevel = Math.round(totalLevel / uniqueUserCount * 10) / 10; // 1 decimal place
      }
      
      // Get today's reminders count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: reminderCount, error: reminderError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .gte('reminder_time', today.toISOString())
        .lt('reminder_time', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());
        
      if (reminderError) throw reminderError;
      
      setStats({
        totalUsers: userCount || 0,
        totalScripts: scriptCount || 0,
        activeStrategies: strategyCount || 0,
        avgXP: totalXP,
        avgLevel: totalLevel,
        highestStreak: maxStreak,
        todayReminders: reminderCount || 0
      });
      
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Platform Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <span className="font-bold">{stats.totalUsers}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Scripts Generated</span>
            </div>
            <span className="font-bold">{stats.totalScripts}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Strategies</span>
            </div>
            <span className="font-bold">{stats.activeStrategies}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Avg. XP</span>
            </div>
            <span className="font-bold">{stats.avgXP}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Avg. Level</span>
            </div>
            <span className="font-bold">{stats.avgLevel}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Highest Streak</span>
            </div>
            <span className="font-bold">{stats.highestStreak} days</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Today's Reminders</span>
            </div>
            <span className="font-bold">{stats.todayReminders}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
