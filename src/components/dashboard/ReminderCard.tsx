
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReminderData } from "@/types/dashboard";
import { format, parseISO, addHours } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarPlus, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ReminderCardProps {
  reminder: ReminderData | null;
  loading: boolean;
  refetchReminders?: () => void;
}

export const ReminderCard = ({ reminder, loading, refetchReminders }: ReminderCardProps) => {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Upcoming Shoot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!reminder) {
    return null;
  }

  if (!reminder.is_active) {
    return null;
  }

  const reminderDate = parseISO(reminder.reminder_time);
  const formattedDate = format(reminderDate, 'EEEE, h:mm a');
  const reminderTypeColor = reminder.reminder_type === 'record' ? 'socialmize-orange' : 'socialmize-purple';
  const reminderBgColor = reminder.reminder_type === 'record' ? 'orange-50' : 'purple-50';
  const reminderDarkBgColor = reminder.reminder_type === 'record' ? 'orange-900/20' : 'purple-900/20';
  const reminderTag = reminder.reminder_type === 'record' ? '📹 Recording Day' : '📱 Posting Time';

  const handleMarkDone = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('award-xp', {
        body: { userId: user.id, reminderId: reminder.id }
      });
      
      if (error) throw error;
      
      toast({
        title: "Reminder completed!",
        description: data.xpAwarded ? `You earned ${data.xpAwarded} XP` : "Good job staying consistent!",
      });
      
      if (refetchReminders) {
        refetchReminders();
      }
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to mark reminder as completed",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSnooze = async () => {
    if (!user) return;
    
    setIsSnoozing(true);
    try {
      // Calculate new reminder time (1 hour from now)
      const newReminderTime = addHours(new Date(), 1).toISOString();
      
      const { error } = await supabase
        .from('reminders')
        .update({ reminder_time: newReminderTime })
        .eq('id', reminder.id);
      
      if (error) throw error;
      
      toast({
        title: "Reminder snoozed",
        description: "We'll remind you again in 1 hour",
      });
      
      if (refetchReminders) {
        refetchReminders();
      }
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive",
      });
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!user) return;
    
    setIsAddingToCalendar(true);
    try {
      // Calculate end time (1 hour after start)
      const endTime = addHours(reminderDate, 1).toISOString();
      
      const { data, error } = await supabase.functions.invoke('add-calendar-event', {
        body: {
          userId: user.id,
          reminderId: reminder.id,
          title: reminder.message || `${reminder.reminder_type === 'record' ? 'Record' : 'Post'} content`,
          description: `SocialMize ${reminder.reminder_type === 'record' ? 'recording' : 'posting'} reminder`,
          startTime: reminder.reminder_time,
          endTime: endTime
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Added to calendar",
        description: "Event was added to your Google Calendar",
      });
      
      if (refetchReminders) {
        refetchReminders();
      }
    } catch (error) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add event to calendar",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <Card className={`mb-6 border-${reminderTypeColor}`}>
      <CardHeader className={`pb-2 bg-${reminderBgColor} dark:bg-${reminderDarkBgColor} rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Upcoming Task</CardTitle>
          <span className="text-xs bg-white dark:bg-background px-2 py-1 rounded-full font-medium">
            {reminderTag}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <h3 className="font-medium text-lg mb-2">
          {formattedDate}
        </h3>
        {reminder.message && (
          <p className="text-sm text-muted-foreground mb-4">{reminder.message}</p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleMarkDone} 
            disabled={isCompleting}
            className={`bg-${reminderTypeColor} hover:opacity-90`}
            size="sm"
          >
            {isCompleting ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-1" /> Mark as Done</>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSnooze}
            disabled={isSnoozing}
          >
            {isSnoozing ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Snoozing</>
            ) : (
              <><Clock className="h-4 w-4 mr-1" /> Snooze 1hr</>
            )}
          </Button>
          
          {!reminder.calendar_event_id && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddToCalendar}
              disabled={isAddingToCalendar}
            >
              {isAddingToCalendar ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding</>
              ) : (
                <><CalendarPlus className="h-4 w-4 mr-1" /> Add to Calendar</>
              )}
            </Button>
          )}
          
          {reminder.calendar_event_id && (
            <span className="text-xs text-muted-foreground flex items-center bg-muted px-2 py-1 rounded">
              <CalendarPlus className="h-3 w-3 mr-1" /> Added to Calendar
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
