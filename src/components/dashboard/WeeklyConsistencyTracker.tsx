
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityRecord {
  day: string;
  count: number;
}

export const WeeklyConsistencyTracker = () => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"week" | "month">("week");
  const [activityData, setActivityData] = useState<ActivityRecord[]>([]);
  const { user } = useAuth();

  // Function to generate the last n days
  const generateLastNDays = (days: number): string[] => {
    const result: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  };

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const days = currentView === "week" ? 7 : 30;
        const dateRange = generateLastNDays(days);
        
        // Get content creation activity (scripts, reminders completed, etc.)
        const { data: scriptData, error: scriptError } = await supabase
          .from('generated_scripts')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', dateRange[0]);
          
        if (scriptError) throw scriptError;
        
        const { data: reminderData, error: reminderError } = await supabase
          .from('reminders')
          .select('updated_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('updated_at', dateRange[0]);
          
        if (reminderError) throw reminderError;

        // Process the activity data
        const activityMap = new Map<string, number>();
        
        // Initialize all days with 0 counts
        dateRange.forEach(day => {
          activityMap.set(day, 0);
        });
        
        // Count scripts created per day
        scriptData.forEach((script: any) => {
          const day = new Date(script.created_at).toISOString().split('T')[0];
          if (activityMap.has(day)) {
            activityMap.set(day, activityMap.get(day)! + 1);
          }
        });
        
        // Count reminders completed per day
        reminderData.forEach((reminder: any) => {
          const day = new Date(reminder.updated_at).toISOString().split('T')[0];
          if (activityMap.has(day)) {
            activityMap.set(day, activityMap.get(day)! + 1);
          }
        });
        
        // Convert map to array of objects for rendering
        const processedData: ActivityRecord[] = Array.from(activityMap.entries()).map(([day, count]) => ({
          day,
          count
        }));
        
        // Sort by day
        processedData.sort((a, b) => a.day.localeCompare(b.day));
        
        setActivityData(processedData);
      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [user, currentView]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getIntensityClass = (count: number): string => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-green-100 dark:bg-green-900/30";
    if (count === 2) return "bg-green-300 dark:bg-green-800/50";
    return "bg-green-500 dark:bg-green-700";
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
          <CalendarDays className="mr-2 h-5 w-5" />
          Consistency Tracker
        </CardTitle>
        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as "week" | "month")}>
          <TabsList className="grid grid-cols-2 w-[160px]">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1 justify-center">
              {activityData.map((record) => (
                <div key={record.day} className="flex flex-col items-center">
                  <div 
                    className={`h-8 w-8 rounded-md flex items-center justify-center ${getIntensityClass(record.count)}`}
                    title={`${formatDate(record.day)}: ${record.count} activities`}
                  >
                    {record.count > 0 && (
                      <span className="text-xs font-semibold">{record.count}</span>
                    )}
                  </div>
                  {currentView === "week" && (
                    <span className="text-xs mt-1">{new Date(record.day).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Track your content creation consistency over time
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
