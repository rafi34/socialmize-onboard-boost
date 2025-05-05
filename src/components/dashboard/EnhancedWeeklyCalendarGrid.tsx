
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { WeeklyCalendarDataProvider, useWeeklyCalendar } from "./WeeklyCalendarDataProvider";
import { CalendarDay } from "./CalendarDay";
import { StrategyData } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyCalendarGridProps {
  strategy: StrategyData | null;
  loading: boolean;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday", 
  "Friday",
  "Saturday",
  "Sunday"
];

export const EnhancedWeeklyCalendarGrid = ({ 
  strategy, 
  loading 
}: WeeklyCalendarGridProps) => {
  return (
    <WeeklyCalendarDataProvider>
      <WeeklyCalendarGridContent strategy={strategy} loading={loading} />
    </WeeklyCalendarDataProvider>
  );
};

const WeeklyCalendarGridContent = ({ 
  strategy, 
  loading 
}: WeeklyCalendarGridProps) => {
  const { calendarData, isLoading, error } = useWeeklyCalendar();
  const [todayDay, setTodayDay] = useState<string>("");
  
  useEffect(() => {
    // Get today's day of the week
    const today = new Date();
    setTodayDay(format(today, 'EEEE'));
  }, []);
  
  // Get available content types from strategy
  const availableContentTypes = strategy?.content_types || [
    "Talking Head", 
    "Duet", 
    "Carousel", 
    "Meme", 
    "Voiceover"
  ];
  
  // For export functionality (placeholder for now)
  const handleExportCalendar = () => {
    const jsonData = JSON.stringify(calendarData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `content-calendar-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading || isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-socialmize-purple" /> 
              Weekly Content Schedule
            </CardTitle>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array(7).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-socialmize-purple" /> 
            Weekly Content Schedule
          </CardTitle>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportCalendar}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
          {daysOfWeek.map(day => (
            <CalendarDay
              key={day}
              day={day}
              isToday={day === todayDay}
              contentTypes={calendarData[day] || []}
              availableContentTypes={availableContentTypes}
            />
          ))}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
