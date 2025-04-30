
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { StrategyData, ProgressData, ReminderData, GeneratedScript } from "@/types/dashboard";
import { CreatorSummaryHeader } from "@/components/dashboard/CreatorSummaryHeader";
import { StrategyOverviewCard } from "@/components/dashboard/StrategyOverviewCard";
import { WeeklyCalendarGrid } from "@/components/dashboard/WeeklyCalendarGrid";
import { ContentGeneratorSection } from "@/components/dashboard/ContentGeneratorSection";
import { TodaysMissionCard } from "@/components/dashboard/TodaysMissionCard";
import { ScriptPreviewsSection } from "@/components/dashboard/ScriptPreviewsSection";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { ScriptsSection } from "@/components/dashboard/ScriptsSection";
import { StrategyPlanSection } from "@/components/dashboard/StrategyPlanSection";
import { Navigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState("");

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
        .select('id, user_id, experience_level, content_types, weekly_calendar, first_five_scripts, full_plan_text, niche_topic, topic_ideas, posting_frequency, creator_style')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (strategyError) {
        console.error("Error fetching strategy:", strategyError);
      }
      
      // If strategy exists in database, use it
      if (strategyData && !strategyError) {
        console.log("Strategy data from DB:", strategyData);
        
        const processedStrategy: StrategyData = {
          experience_level: strategyData.experience_level,
          content_types: strategyData.content_types as string[],
          weekly_calendar: strategyData.weekly_calendar as Record<string, string[]>,
          starter_scripts: strategyData.first_five_scripts as { title: string; script: string }[],
          // Use the dynamic values from DB or provide fallbacks if not available
          posting_frequency: strategyData.posting_frequency || "3-5x per week",
          creator_style: strategyData.creator_style || "Authentic",
          content_breakdown: {
            "Duet": 2,
            "Meme": 1,
            "Carousel": 2,
            "Voiceover": 1
          },
          full_plan_text: strategyData.full_plan_text,
          niche_topic: strategyData.niche_topic,
          topic_ideas: strategyData.topic_ideas as string[]
        };
        setStrategy(processedStrategy);
        setIsGeneratingStrategy(false);
      } else {
        // If no strategy found, check if we need to generate it
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_answers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (onboardingError) {
          console.error("Error fetching onboarding data:", onboardingError);
        }
        
        if (onboardingData) {
          // We have onboarding data but no strategy - initiate generation
          setIsGeneratingStrategy(true);
          generateStrategy(onboardingData);
        }
        
        // Check localStorage as fallback
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
      
      try {
        // Use our new RPC function to fetch generated scripts
        const { data: scriptsData, error: scriptsError } = await supabase
          .rpc('get_generated_scripts', { user_id_param: user.id });
            
        if (scriptsError) {
          console.error("Error fetching scripts:", scriptsError);
        } else if (scriptsData) {
          setScripts(scriptsData as GeneratedScript[]);
        }
      } catch (error) {
        console.error("Error fetching generated scripts:", error);
        setScripts(null);
      }
      
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error loading data",
        description: "There was a problem loading your dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      
      // Set a timeout to show content after 15s even if strategy is still generating
      if (isGeneratingStrategy) {
        setTimeout(() => {
          setShowContent(true);
        }, 15000);
      } else {
        setShowContent(true);
      }
    }
  }, [user]);

  // Generate waiting message from OpenAI
  const generateWaitingMessage = useCallback(async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase.functions.invoke("generate-waiting-message", {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error("Error generating waiting message:", error);
        return;
      }
      
      if (data?.message) {
        setWaitingMessage(data.message);
      }
    } catch (error) {
      console.error("Error generating waiting message:", error);
    }
  }, [user]);

  // Generate strategy function
  const generateStrategy = async (onboardingData: any) => {
    try {
      if (!user) return;
      
      // Generate custom waiting message while we wait
      generateWaitingMessage();
      
      const { data, error } = await supabase.functions.invoke("generate-strategy", {
        body: { onboardingAnswers: onboardingData }
      });
      
      if (error) {
        console.error("Error generating strategy:", error);
        toast({
          title: "Strategy Generation Failed",
          description: "We couldn't generate your content strategy. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.strategy) {
        // Strategy generated successfully, fetch the data
        fetchUserData();
        toast({
          title: "Strategy Generated",
          description: "Your personalized content strategy is ready!",
        });
      }
    } catch (error) {
      console.error("Error generating strategy:", error);
      toast({
        title: "Strategy Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStrategy(false);
      setShowContent(true);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Redirect if onboarding is not complete
  if (profileComplete === false) {
    return <Navigate to="/" replace />;
  }

  // Show loading screen if we're generating strategy and haven't timed out yet
  if (isGeneratingStrategy && !showContent) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
        <main className="flex-grow flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-socialmize-purple mx-auto"></div>
            <h1 className="text-2xl font-bold">Generating Your Content Strategy</h1>
            
            {waitingMessage ? (
              <p className="text-lg">{waitingMessage}</p>
            ) : (
              <p className="text-lg">Our AI is analyzing your profile to create a personalized content strategy...</p>
            )}
            
            <p className="text-sm text-muted-foreground">This takes about 15-30 seconds. You'll be redirected automatically when it's ready.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow container py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Creator Summary Header */}
          <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
          
          {/* Strategy Plan Section - New component */}
          <StrategyPlanSection />
          
          {/* Strategy Overview Card */}
          <StrategyOverviewCard 
            strategy={strategy} 
            loading={loading} 
            refetchStrategy={fetchUserData} 
          />
          
          {/* Weekly Calendar Grid */}
          <WeeklyCalendarGrid strategy={strategy} loading={loading} />
          
          {/* Content Generator Section */}
          <ContentGeneratorSection 
            strategy={strategy} 
            loading={loading} 
            refetchScripts={fetchUserData} 
          />
          
          {/* Today's Mission Card */}
          <TodaysMissionCard strategy={strategy} loading={loading} />
          
          {/* Scripts Section - For starter scripts */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Starter Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptsSection strategy={strategy} loading={loading} />
            </CardContent>
          </Card>
          
          {/* Script Previews Section - For generated scripts */}
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
