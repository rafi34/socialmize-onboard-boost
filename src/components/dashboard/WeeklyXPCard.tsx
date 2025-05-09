
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Flame, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WeeklyXPCard = () => {
  const { user } = useAuth();
  const [weeklyXP, setWeeklyXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWeeklyXP();
    }
  }, [user]);

  const fetchWeeklyXP = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = startOfWeek(new Date()).toISOString();
      
      const { data, error } = await supabase.functions.invoke("get-weekly-xp", {
        body: { userId: user?.id, startDate },
      });
      
      if (error) throw error;
      
      if (data && data.success) {
        setWeeklyXP(data.xp || 0);
        setStreak(data.streak || 0);
      } else {
        console.error("Failed to get weekly XP:", data?.error);
        setError(data?.error || "Failed to fetch XP data");
      }
    } catch (err: any) {
      console.error("Error fetching weekly XP:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-500" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-bold">{weeklyXP} XP</div>
              <div className="text-sm text-muted-foreground">this week</div>
            </div>
            
            {streak > 0 && (
              <div className="flex items-center mt-2 gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <Badge variant="secondary" className="text-xs">
                  {streak}-day streak
                </Badge>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
