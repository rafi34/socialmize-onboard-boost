
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, AlertTriangle } from "lucide-react";

export const WeeklyConsistencyCard = () => {
  const [weeklyXP, setWeeklyXP] = useState<number>(0);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const startDate = startOfWeek(new Date());
  const endDate = endOfWeek(new Date());
  const formattedDateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  
  useEffect(() => {
    const fetchWeeklyXP = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch weekly XP from the database function
        const { data, error } = await supabase.rpc(
          'get_weekly_xp',
          { 
            user_id_param: user.id,
            start_date_param: startOfWeek(new Date()).toISOString()
          }
        );
        
        if (error) throw error;
        
        setWeeklyXP(data || 0);
        
        // Get the user's strategy to determine appropriate goal
        const { data: strategyData, error: strategyError } = await supabase
          .from("strategy_profiles")
          .select("posting_frequency")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (strategyError) throw strategyError;
        
        // Set weekly goal based on posting frequency
        if (strategyData) {
          const frequency = strategyData.posting_frequency;
          let goal = 100; // default
          
          switch(frequency) {
            case 'Daily':
              goal = 200;
              break;
            case '3-5 times per week':
              goal = 150;
              break;
            case '1-2 times per week':
              goal = 100;
              break;
            default:
              goal = 100;
          }
          
          setWeeklyGoal(goal);
        }
        
      } catch (e: any) {
        console.error("Error fetching weekly consistency data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyXP();
  }, [user]);
  
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min(100, (weeklyXP / weeklyGoal) * 100);
  
  // Determine level based on XP
  let level = "Beginner";
  
  if (weeklyXP >= 150) {
    level = "Expert";
  } else if (weeklyXP >= 100) {
    level = "Advanced";
  } else if (weeklyXP >= 50) {
    level = "Intermediate";
  }
  
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">There was an error loading your progress.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex justify-between items-center">
          <span>Weekly Progress</span>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        <CardDescription>{formattedDateRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-end mb-1">
            <div>
              <p className="text-sm text-muted-foreground">Weekly XP</p>
              <p className="text-2xl font-bold">{weeklyXP}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Goal</p>
              <p className="text-lg font-medium">{weeklyGoal} XP</p>
            </div>
          </div>
          
          <Progress 
            value={progressPercentage} 
            indicatorClassName={`
              ${progressPercentage < 30 ? 'bg-red-500' : 
                progressPercentage < 70 ? 'bg-yellow-500' : 
                'bg-green-500'}
            `}
          />
          
          <div className="pt-2 flex justify-between items-center">
            <div className="flex items-center gap-1 bg-accent/50 rounded-full px-3 py-1">
              <Trophy className={`h-4 w-4 ${
                level === "Expert" ? "text-yellow-500" : 
                level === "Advanced" ? "text-blue-500" : 
                level === "Intermediate" ? "text-green-500" : 
                "text-gray-500"
              }`} />
              <p className="text-xs font-medium">{level} Level</p>
            </div>
            <p className="text-sm text-muted-foreground">{progressPercentage.toFixed(0)}% complete</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
