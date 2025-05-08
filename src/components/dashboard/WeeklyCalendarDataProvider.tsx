import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useStrategyData } from "@/hooks/useStrategyData";

type WeeklyCalendarContextType = {
  calendarData: Record<string, string[]>;
  isLoading: boolean;
  updateCalendarData: (day: string, contentTypes: string[]) => Promise<boolean>;
  error: string | null;
};

const WeeklyCalendarContext = createContext<WeeklyCalendarContextType>({
  calendarData: {},
  isLoading: true,
  updateCalendarData: async () => false,
  error: null
});

export const useWeeklyCalendar = () => useContext(WeeklyCalendarContext);

interface WeeklyCalendarDataProviderProps {
  children: ReactNode;
}

export const WeeklyCalendarDataProvider = ({ children }: WeeklyCalendarDataProviderProps) => {
  const { user } = useAuth();
  const { strategy, loading: strategyLoading, fetchStrategyData } = useStrategyData();
  const [calendarData, setCalendarData] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateAttempts, setUpdateAttempts] = useState(0);
  const { toast } = useToast();
  const MAX_UPDATE_ATTEMPTS = 2;

  // Initialize calendar data from strategy
  useEffect(() => {
    if (!strategyLoading && strategy?.weekly_calendar) {
      console.log("Setting calendar data from strategy:", strategy.weekly_calendar);
      setCalendarData(strategy.weekly_calendar);
      setIsLoading(false);
    } else if (!strategyLoading) {
      // Create empty calendar if none exists
      const defaultCalendar: Record<string, string[]> = {
        "Monday": [],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Saturday": [],
        "Sunday": []
      };
      setCalendarData(defaultCalendar);
      setIsLoading(false);
    }
  }, [strategy, strategyLoading]);

  const updateCalendarData = async (day: string, contentTypes: string[]): Promise<boolean> => {
    if (!user) return false;
    
    // Reset error state
    setError(null);
    
    try {
      console.log(`Updating calendar data for ${day}:`, contentTypes);
      
      // Create a copy of the current calendar data
      const updatedCalendar = { ...calendarData };
      updatedCalendar[day] = contentTypes;
      
      // Update local state first for immediate UI feedback
      setCalendarData(updatedCalendar);
      
      // Update the calendar in the database
      const { error: updateError } = await supabase
        .from("strategy_profiles")
        .update({ 
          weekly_calendar: updatedCalendar,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (updateError) throw updateError;
      
      // Only show notification on success
      toast({
        title: "Calendar Updated",
        description: `Your content schedule for ${day} has been updated.`,
      });
      
      // Reset update attempts counter on success
      setUpdateAttempts(0);
      
      // Refresh strategy data to ensure everything is in sync
      await fetchStrategyData();
      
      return true;
    } catch (err: any) {
      console.error("Error updating calendar:", err);
      setError(err.message || "Failed to update calendar");
      
      // Only show toast if we've exceeded retry attempts
      if (updateAttempts >= MAX_UPDATE_ATTEMPTS) {
        toast({
          title: "Update Failed",
          description: "There was a problem updating your content schedule. Please try again.",
          variant: "destructive",
        });
      } else {
        // Increment attempt counter
        setUpdateAttempts(prev => prev + 1);
      }
      
      return false;
    }
  };

  return (
    <WeeklyCalendarContext.Provider value={{ calendarData, isLoading, updateCalendarData, error }}>
      {children}
    </WeeklyCalendarContext.Provider>
  );
};
