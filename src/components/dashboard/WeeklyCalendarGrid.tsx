
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { StrategyData } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DayContentProps } from "react-day-picker";

interface WeeklyCalendarGridProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const WeeklyCalendarGrid = ({ strategy, loading }: WeeklyCalendarGridProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const getContentStatusForDay = (day: string): { content: string[], status: 'needs-content' | 'generated' | 'posted' } => {
    const dayStr = day.toLowerCase();
    const dayData = strategy.weekly_calendar![dayStr] || [];
    
    // This is a mock implementation - in a real app, you'd check against generated_scripts
    // and posted_content tables to determine the actual status
    return {
      content: dayData,
      status: dayData.length ? 'needs-content' : 'needs-content'
    };
  };

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const getDayClassName = (day: string) => {
    const { status } = getContentStatusForDay(day);
    
    let statusClass = 'bg-gray-100';
    if (status === 'needs-content') statusClass = 'bg-red-100 border-red-200';
    if (status === 'generated') statusClass = 'bg-yellow-100 border-yellow-200';
    if (status === 'posted') statusClass = 'bg-green-100 border-green-200';
    
    return `h-full w-full ${statusClass} p-1 rounded-md text-xs`;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weekly Content Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground">
          {format(date, 'MMMM yyyy')}
        </div>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          className="border rounded-md"
          components={{
            DayContent: (props: DayContentProps) => {
              const dateStr = props.date ? format(props.date, 'EEEE').toLowerCase() : '';
              const { content } = getContentStatusForDay(dateStr);
              
              return (
                <div 
                  className={getDayClassName(dateStr)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(dateStr);
                  }}
                >
                  <div>{props.date ? format(props.date, 'd') : ''}</div>
                  {content.length > 0 && (
                    <div className="mt-1">
                      {content.slice(0, 1).map((item, i) => (
                        <div key={i} className="truncate">{item}</div>
                      ))}
                      {content.length > 1 && <div>+{content.length - 1}</div>}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDay && selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Content</DialogTitle>
            </DialogHeader>
            
            {selectedDay && strategy.weekly_calendar![selectedDay.toLowerCase()]?.map((content, i) => (
              <div key={i} className="p-3 border rounded-md mb-2">
                <div className="font-medium mb-1">{content}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Generate</Button>
                  <Button variant="outline" size="sm">View Script</Button>
                  <Button size="sm">Mark Posted</Button>
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
