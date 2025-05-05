
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReminderData } from "@/types/dashboard";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, BellDot, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Reminders() {
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [pastReminders, setPastReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Fetch upcoming reminders
      const { data: upcomingData, error: upcomingError } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .gt("reminder_time", now)
        .order("reminder_time", { ascending: true });

      if (upcomingError) throw upcomingError;
      
      // Fetch past reminders (including completed ones)
      const { data: pastData, error: pastError } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user?.id)
        .lt("reminder_time", now)
        .order("reminder_time", { ascending: false })
        .limit(10);

      if (pastError) throw pastError;
      
      setReminders(upcomingData as ReminderData[]);
      setPastReminders(pastData as ReminderData[]);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast({
        title: "Failed to load reminders",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reminders", {
        body: { userId: user?.id }
      });

      if (error) throw error;
      
      toast({
        title: "Reminders Generated",
        description: `${data?.reminderCount || 0} reminders have been created for your content calendar.`,
      });
      
      // Refetch reminders
      fetchReminders();
    } catch (error) {
      console.error("Error generating reminders:", error);
      toast({
        title: "Failed to generate reminders",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <PageHeader 
        title="Content Reminders" 
        description="Stay on track with your content creation schedule"
        icon={<BellDot className="w-8 h-8" />}
        actions={
          <Button 
            onClick={generateReminders} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Generate Reminders
          </Button>
        }
      />
      
      <div className="mt-8">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : reminders.length > 0 ? (
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    loading={false}
                    refetchReminders={fetchReminders}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming reminders</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  Generate new reminders or check your content calendar
                </p>
                <Button onClick={generateReminders} disabled={refreshing}>
                  {refreshing ? "Generating..." : "Generate Reminders"}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : pastReminders.length > 0 ? (
              <div className="space-y-4">
                {pastReminders.map((reminder) => (
                  <div key={reminder.id} className="border rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{reminder.content_title || "Content Reminder"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reminder.reminder_time).toLocaleString()}
                        </p>
                        <p className="text-xs mt-2 inline-flex items-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            reminder.completed 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}>
                            {reminder.completed ? "Completed" : "Missed"}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                          reminder.reminder_type === 'record'
                            ? "bg-socialmize-orange/10 text-socialmize-orange" 
                            : "bg-socialmize-purple/10 text-socialmize-purple"
                        }`}>
                          {reminder.reminder_type === 'record' ? '📹 Recording' : '📱 Posting'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-medium">No past reminders</h3>
                <p className="text-muted-foreground mt-1">
                  Your reminder history will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
