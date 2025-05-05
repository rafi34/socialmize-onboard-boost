
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { StrategyData } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DayContentProps } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, CalendarCheck, FileText, Image, Video, Headphones, Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "@/components/ui/use-toast";

interface WeeklyCalendarGridProps {
  strategy: StrategyData | null;
  loading: boolean;
}

interface Reminder {
  id: string;
  content_format?: string;
  content_title?: string;
  reminder_time: string;
  completed?: boolean;
}

const ContentTypeIcons: Record<string, React.ReactNode> = {
  'duet': <Video className="h-4 w-4" />,
  'carousel': <Image className="h-4 w-4" />,
  'meme': <Image className="h-4 w-4" />,
  'voiceover': <Headphones className="h-4 w-4" />,
  'talking head': <Mic className="h-4 w-4" />,
  'tutorial': <FileText className="h-4 w-4" />,
  'default': <FileText className="h-4 w-4" />
};

export const WeeklyCalendarGrid = ({ strategy, loading }: WeeklyCalendarGridProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isCalendarAdded, setIsCalendarAdded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('id, reminder_time, content_format, content_title, completed')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      
      // Make sure we only set the reminders state if we have valid data
      if (data) {
        setReminders(data as Reminder[]);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const addToCalendar = async () => {
    if (!user || !strategy?.weekly_calendar) return;

    try {
      const { data, error } = await supabase.functions.invoke('add-calendar-event', {
        body: { 
          userId: user.id,
          weeklyCalendar: strategy.weekly_calendar
        }
      });

      if (error) throw error;
      
      setIsCalendarAdded(true);
      toast({
        title: "Calendar Updated",
        description: "Your content calendar has been added to your reminders.",
      });
      
      // Generate reminders based on the weekly calendar
      await supabase.functions.invoke('generate-reminders', {
        body: { 
          userId: user.id
        }
      });
      
      // Refresh the reminders list
      fetchReminders();
      
      // Add XP for setting up calendar
      await supabase.functions.invoke('award-xp', {
        body: { 
          userId: user.id,
          amount: 15,
          type: 'calendar_setup'
        }
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast({
        title: "Error",
        description: "Failed to update your calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Content Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy || !strategy.weekly_calendar) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Content Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">No content calendar available yet.</p>
          <Button>Generate Calendar</Button>
        </CardContent>
      </Card>
    );
  }

  const getContentStatusForDay = (day: string): { 
    content: string[], 
    status: 'needs-content' | 'generated' | 'posted',
    hasReminder: boolean,
    reminderCompleted: boolean
  } => {
    const dayStr = day.toLowerCase();
    const dayData = strategy.weekly_calendar![dayStr] || [];
    
    // Check if there's a reminder for this day
    const today = new Date();
    const todayFormatted = format(today, 'EEEE').toLowerCase();
    const hasReminder = reminders.some(r => {
      const reminderDay = format(new Date(r.reminder_time), 'EEEE').toLowerCase();
      return reminderDay === dayStr;
    });
    
    const reminderCompleted = reminders.some(r => {
      const reminderDay = format(new Date(r.reminder_time), 'EEEE').toLowerCase();
      return reminderDay === dayStr && r.completed;
    });
    
    // Show today's content as 'needs-content', past days as 'missed', future as 'upcoming'
    let status: 'needs-content' | 'generated' | 'posted' = 'needs-content';
    
    if (reminderCompleted) {
      status = 'posted';
    } else if (hasReminder) {
      status = 'generated';
    }
    
    return {
      content: dayData,
      status,
      hasReminder,
      reminderCompleted
    };
  };

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const getDayClassName = (day: string) => {
    const { status, hasReminder } = getContentStatusForDay(day);
    
    let statusClass = 'bg-gray-100 border-gray-200';
    if (status === 'needs-content') statusClass = 'bg-yellow-50 border-yellow-200';
    if (status === 'generated') statusClass = 'bg-blue-50 border-blue-200';
    if (status === 'posted') statusClass = 'bg-green-50 border-green-200';
    
    const today = format(new Date(), 'EEEE').toLowerCase();
    if (day.toLowerCase() === today) {
      statusClass += ' ring-2 ring-socialmize-purple ring-opacity-50';
    }
    
    return `h-full w-full ${statusClass} p-2 rounded-md text-xs border transition-all hover:shadow-md`;
  };

  const getContentIcon = (contentType: string) => {
    const normalizedType = contentType.toLowerCase();
    for (const [key, icon] of Object.entries(ContentTypeIcons)) {
      if (normalizedType.includes(key)) {
        return icon;
      }
    }
    return ContentTypeIcons.default;
  };

  const getStatusBadge = (day: string) => {
    const { status, hasReminder } = getContentStatusForDay(day);
    const today = format(new Date(), 'EEEE').toLowerCase();
    const isToday = day.toLowerCase() === today;
    
    if (status === 'posted') {
      return <Badge className="bg-green-500">Posted</Badge>;
    }
    
    if (status === 'generated') {
      return <Badge className="bg-blue-500">Ready to Post</Badge>;
    }
    
    if (isToday) {
      return <Badge className="bg-socialmize-purple">Today</Badge>;
    }
    
    return null;
  };

  const handleMarkAsPosted = async (day: string, contentType: string) => {
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
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Weekly Content Calendar
        </CardTitle>
        <Button 
          onClick={addToCalendar} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          disabled={isCalendarAdded}
        >
          <CalendarCheck className="h-4 w-4" />
          {isCalendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          {format(date, 'MMMM yyyy')}
        </div>
        
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="flex flex-col h-full">
                <div className="text-center font-medium text-sm mb-1">{day.slice(0, 3)}</div>
                <div 
                  className={getDayClassName(day)}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{day}</span>
                    {getStatusBadge(day)}
                  </div>
                  
                  {strategy.weekly_calendar![day.toLowerCase()]?.map((content, i) => (
                    <HoverCard key={i}>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-1 p-1 my-1 bg-white rounded border text-xs cursor-pointer hover:bg-gray-50">
                          {getContentIcon(content)}
                          <span className="truncate">{content}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 text-sm">
                        <div className="font-medium">{content}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click on the day to see more details and generate content for this idea.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                  
                  {(!strategy.weekly_calendar![day.toLowerCase()] || 
                    strategy.weekly_calendar![day.toLowerCase()].length === 0) && (
                    <div className="text-center p-2 text-muted-foreground">
                      No content planned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {selectedDay && selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Content
              </DialogTitle>
            </DialogHeader>
            
            {selectedDay && strategy.weekly_calendar![selectedDay.toLowerCase()]?.map((content, i) => (
              <div key={i} className="p-3 border rounded-md mb-2 animate-fade-in">
                <div className="flex items-center gap-2 font-medium mb-2">
                  {getContentIcon(content)}
                  <span>{content}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  This content is recommended for {selectedDay}. Generate a script or mark it as complete when posted.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Generate Script
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => handleMarkAsPosted(selectedDay, content)}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Mark as Posted
                  </Button>
                </div>
              </div>
            ))}
            
            {(!selectedDay || !strategy.weekly_calendar![selectedDay.toLowerCase()]?.length) && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No content planned for this day.</p>
                <Button>Add Content</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
