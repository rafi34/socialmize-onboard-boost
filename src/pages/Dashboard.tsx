import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { StrategyData, ProgressData, ReminderData, GeneratedScript } from "@/types/dashboard";
import { CreatorSummaryHeader } from "@/components/dashboard/CreatorSummaryHeader";
import { StrategyOverviewCard } from "@/components/dashboard/StrategyOverviewCard";
import { WeeklyCalendarGrid } from "@/components/dashboard/WeeklyCalendarGrid";
import { GenerateContentSection } from "@/components/dashboard/GenerateContentSection";
import { TodaysMissionCard } from "@/components/dashboard/TodaysMissionCard";
import { ScriptPreviewsSection } from "@/components/dashboard/ScriptPreviewsSection";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { ScriptsSection } from "@/components/dashboard/ScriptsSection";
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Check if onboarding is complete
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfileComplete(profileData.onboarding_complete);
        
        // If not onboarded, don't try to fetch other data
        if (!profileData.onboarding_complete) {
          setLoading(false);
          return;
        }
      }
      
      // Try to fetch strategy from database
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (strategyError) {
        console.error("Error fetching strategy:", strategyError);
      }
      
      // If strategy exists in database, use it
      if (strategyData) {
        const processedStrategy: StrategyData = {
          experience_level: strategyData.experience_level,
          content_types: strategyData.content_types as string[],
          weekly_calendar: strategyData.weekly_calendar as Record<string, string[]>,
          starter_scripts: strategyData.first_five_scripts as { title: string; script: string }[],
          posting_frequency: "3x per week", // This would come from the DB in a real app
          creator_style: "Authentic & Educational", // This would come from the DB in a real app
          content_breakdown: {
            "Duet": 2,
            "Meme": 1,
            "Carousel": 2,
            "Voiceover": 1
          },
          full_plan_text: strategyData.full_plan_text as string
        };
        setStrategy(processedStrategy);
      } else {
        // Otherwise, try to use localStorage as fallback
        const storedStrategy = localStorage.getItem('userStrategy');
        if (storedStrategy) {
          try {
            setStrategy(JSON.parse(storedStrategy));
          } catch (error) {
            console.error("Error parsing strategy from localStorage:", error);
          }
        }
      }
      
      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
          
      if (progressError) {
        console.error("Error fetching progress:", progressError);
      } else if (progressData) {
        setProgress({
          current_xp: progressData.current_xp || 0,
          current_level: progressData.current_level || 1,
          streak_days: progressData.streak_days || 0,
          last_activity_date: progressData.last_activity_date || new Date().toISOString(),
          xp_next_level: (progressData.current_level + 1) * 100,
          level_tag: progressData.current_level === 1 ? 'Beginner' : 
                    progressData.current_level === 2 ? 'Explorer' : 'Creator'
        });
      }
      
      // Fetch reminders
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('reminder_time', { ascending: true })
        .limit(1)
        .maybeSingle();
          
      if (reminderError) {
        console.error("Error fetching reminder:", reminderError);
      } else if (reminderData) {
        setReminder(reminderData as ReminderData);
      }
      
      // In a real app, we would fetch generated scripts here
      // For now, using mock data
      setScripts([
        {
          id: '1',
          title: 'The AI Revolution',
          hook: "Want to earn passive income with AI? Here is what I learned...",
          content: 'Full script content here...',
          format_type: 'Carousel',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Morning Routine',
          hook: "My 5-minute morning routine that changed everything...",
          content: 'Full script content here...',
          format_type: 'Talking Head',
          created_at: new Date().toISOString()
        },
      ]);
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Redirect if onboarding is not complete
  if (profileComplete === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <Navbar />
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Creator Summary Header */}
          <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
          
          {/* Strategy Overview Card */}
          <StrategyOverviewCard 
            strategy={strategy} 
            loading={loading} 
            refetchStrategy={fetchUserData} 
          />
          
          {/* Weekly Calendar Grid */}
          <WeeklyCalendarGrid strategy={strategy} loading={loading} />
          
          {/* Generate Content Section */}
          <GenerateContentSection strategy={strategy} loading={loading} />
          
          {/* Today's Mission Card */}
          <TodaysMissionCard strategy={strategy} loading={loading} />
          
          {/* Scripts Section - Reusing from existing components */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Starter Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptsSection strategy={strategy} loading={loading} />
            </CardContent>
          </Card>
          
          {/* Script Previews Section */}
          <ScriptPreviewsSection scripts={scripts} loading={loading} />
          
          {/* Reminder Card - Only shown if a reminder exists */}
          <ReminderCard reminder={reminder} loading={loading} />
          
          {/* Level Progress Card */}
          <LevelProgressCard progress={progress} loading={loading} />
        </div>
      </main>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
