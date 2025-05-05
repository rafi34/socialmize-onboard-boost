
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData, ReminderData } from "@/types/dashboard";
import { WeeklyCalendarGrid } from "@/components/dashboard/WeeklyCalendarGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { CalendarDays, FileText, CalendarCheck } from "lucide-react";

export default function WeeklyCalendar() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentByDay, setContentByDay] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (user) {
      fetchStrategyData();
      fetchReminders();
    }
  }, [user]);

  const fetchStrategyData = async () => {
    try {
      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("weekly_calendar, content_types, posting_frequency, creator_style, experience_level")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStrategy({
          weekly_calendar: data.weekly_calendar as Record<string, string[]>,
          content_types: data.content_types as string[],
          posting_frequency: data.posting_frequency || "moderate",
          creator_style: data.creator_style || "educational",
          experience_level: data.experience_level || "beginner",
          content_breakdown: {}
        });

        // Organize content by day for the detailed view
        if (data.weekly_calendar) {
          setContentByDay(data.weekly_calendar as Record<string, string[]>);
        }
      }
    } catch (error) {
      console.error("Error fetching strategy data:", error);
      toast({
        title: "Error",
        description: "Failed to load your content calendar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("reminder_time", { ascending: true });

      if (error) throw error;
      
      if (data) {
        setReminders(data as ReminderData[]);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const generateReminders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("generate-reminders", {
        body: { userId: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Reminders Generated",
        description: `${data?.reminderCount || 0} reminders have been created for your content calendar.`,
      });

      // Refresh reminders
      fetchReminders();
    } catch (error) {
      console.error("Error generating reminders:", error);
      toast({
        title: "Error",
        description: "Failed to generate reminders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusForContent = (day: string, contentType: string) => {
    const dayReminders = reminders.filter(r => {
      const reminderDay = format(new Date(r.reminder_time), 'EEEE').toLowerCase();
      return reminderDay === day.toLowerCase() && 
            r.content_format?.toLowerCase() === contentType.toLowerCase();
    });
    
    if (dayReminders.length > 0) {
      const reminder = dayReminders[0];
      return reminder.completed ? "completed" : "scheduled";
    }
    
    return "not-scheduled";
  };

  const markAsPosted = async (day: string, contentType: string) => {
    if (!user) return;
    
    try {
      // Find the reminder for this day and content type
      const dayReminders = reminders.filter(r => {
        const reminderDay = format(new Date(r.reminder_time), 'EEEE').toLowerCase();
        return reminderDay === day.toLowerCase() && 
              r.content_format?.toLowerCase() === contentType.toLowerCase();
      });
      
      if (dayReminders.length > 0) {
        const reminder = dayReminders[0];
        
        // Update the reminder as completed
        const { error } = await supabase
          .from('reminders')
          .update({ completed: true })
          .eq('id', reminder.id);
          
        if (error) throw error;
        
        // Refresh reminders
        fetchReminders();
        
        // Award XP for posting content
        await supabase.functions.invoke('award-xp', {
          body: { 
            userId: user.id,
            amount: 25,
            type: 'post_content'
          }
        });
        
        toast({
          title: "Content Posted",
          description: `Great job! You've marked ${contentType} as posted.`,
        });
      } else {
        // No reminder found, create one that's already completed
        const reminderTime = new Date();
        const { error } = await supabase
          .from('reminders')
          .insert({
            user_id: user.id,
            reminder_type: 'post',
            reminder_time: reminderTime.toISOString(),
            content_format: contentType,
            content_title: `${contentType} for ${day}`,
            completed: true,
            is_active: true
          });
          
        if (error) throw error;
        
        // Refresh reminders
        fetchReminders();
        
        toast({
          title: "Content Posted",
          description: `Great job! You've marked ${contentType} as posted.`,
        });
      }
    } catch (error) {
      console.error('Error marking content as posted:', error);
      toast({
        title: "Error",
        description: "Failed to update content status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <main className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            Weekly Content Calendar
          </h1>
          <Button 
            onClick={generateReminders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <CalendarCheck className="h-4 w-4" />
            Generate Reminders
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Full Calendar View */}
          <WeeklyCalendarGrid strategy={strategy} loading={loading} />
          
          {/* Detailed Day-by-Day View */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Content Details by Day</h2>
            
            {Object.entries(contentByDay).length > 0 ? (
              Object.entries(contentByDay)
                .sort((a, b) => {
                  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                  return days.indexOf(a[0]) - days.indexOf(b[0]);
                })
                .map(([day, contents]) => (
                  <Card key={day} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 dark:bg-muted/30">
                      <CardTitle className="capitalize">{day}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {contents && contents.length > 0 ? (
                        <div className="space-y-3">
                          {contents.map((content, index) => {
                            const status = getStatusForContent(day, content);
                            return (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{content}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Status: {
                                        status === "completed" ? "Posted ✓" : 
                                        status === "scheduled" ? "Scheduled" : 
                                        "Not scheduled"
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.location.href = "/generate-scripts"} 
                                  >
                                    Generate Script
                                  </Button>
                                  <Button 
                                    size="sm"
                                    disabled={status === "completed"}
                                    onClick={() => markAsPosted(day, content)}
                                  >
                                    {status === "completed" ? "Posted ✓" : "Mark as Posted"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No content planned for this day.</p>
                      )}
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="py-6">
                  <p className="text-center text-muted-foreground">
                    {loading ? "Loading your content calendar..." : "No content schedule found. Generate your content strategy first."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
