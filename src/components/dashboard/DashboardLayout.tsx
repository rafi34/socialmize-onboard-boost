import { EnhancedWeeklyCalendarGrid } from "./EnhancedWeeklyCalendarGrid";
import { CreatorSummaryHeader } from "./CreatorSummaryHeader";
import { TodaysMissionCard } from "./TodaysMissionCard";
import { ReminderCard } from "./ReminderCard";
import { LevelProgressCard } from "./LevelProgressCard";
import { ScriptPreviewsSection } from "./ScriptPreviewsSection";
import { StrategyOverviewSection } from "./StrategyOverviewSection";
import { ContentMissionsSection } from "./ContentMissionsSection";
import { WeeklyConsistencyCard } from "./WeeklyConsistencyCard";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData, ProgressData, ReminderData, GeneratedScript } from "@/types/dashboard";
import { AdminLogDialog } from "../admin/AdminLogDialog";
import { logStrategyAction } from "@/utils/adminLog";

export const DashboardLayout = () => {
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [reminder, setReminder] = useState<ReminderData | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [scripts, setScripts] = useState<GeneratedScript[] | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      checkAdminStatus();
    }
  }, [user]);
  
  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user?.id });
      
      if (error) throw error;
      setIsAdmin(!!data);
      
      // If user is an admin and viewing another user's data, log this action
      if (data && window.location.search.includes('userId=')) {
        const params = new URLSearchParams(window.location.search);
        const targetUserId = params.get('userId');
        if (targetUserId && user) {
          logStrategyAction(user.id, targetUserId, "view", {
            page: "dashboard",
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch strategy data
      const { data: strategyData, error: strategyError } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (strategyError) throw strategyError;
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (progressError) throw progressError;
      
      // Fetch next reminder
      const now = new Date().toISOString();
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .gt('reminder_time', now)
        .order('reminder_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (reminderError) throw reminderError;
      
      // Fetch recent scripts
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (scriptsError) throw scriptsError;
      
      // Prepare data for components
      if (strategyData) {
        setStrategy({
          experience_level: strategyData.experience_level || 'beginner',
          content_types: strategyData.content_types as string[] || [],
          weekly_calendar: strategyData.weekly_calendar as Record<string, string[]> || {},
          posting_frequency: strategyData.posting_frequency || 'moderate',
          creator_style: strategyData.creator_style || 'educational',
          content_breakdown: {} as Record<string, number>,
          niche_topic: strategyData.niche_topic,
          summary: strategyData.summary
        });
      }
      
      if (progressData) {
        const nextLevelXP = (progressData.current_level + 1) * 100;
        
        setProgress({
          current_xp: progressData.current_xp || 0,
          current_level: progressData.current_level || 1,
          streak_days: progressData.streak_days || 0,
          last_activity_date: progressData.last_activity_date || new Date().toISOString(),
          xp_next_level: nextLevelXP,
          level_tag: getLevelTag(progressData.current_level || 1)
        });
      }
      
      if (reminderData) {
        setReminder(reminderData as ReminderData);
      }
      
      if (scriptsData) {
        setScripts(scriptsData as GeneratedScript[]);
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getLevelTag = (level: number): string => {
    const levelTags = [
      "Rookie Creator",
      "Content Apprentice",
      "Social Builder",
      "Content Specialist",
      "Engagement Expert",
      "Creator Pro"
    ];
    
    return levelTags[Math.min(level - 1, levelTags.length - 1)];
  };
  
  const handleRefetchReminders = () => {
    fetchDashboardData();
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <CreatorSummaryHeader user={user} progress={progress} loading={loading} />
      
      <div className="flex flex-col md:flex-row gap-6 mt-8">
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex justify-between items-center">
            <div className="tabs flex border-b">
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'today' ? 'text-socialmize-purple border-b-2 border-socialmize-purple' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('today')}
              >
                Today's Focus
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'missions' ? 'text-socialmize-purple border-b-2 border-socialmize-purple' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('missions')}
              >
                Content Missions
              </button>
              <button 
                className={`px-4 py-2 font-medium ${activeTab === 'strategy' ? 'text-socialmize-purple border-b-2 border-socialmize-purple' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('strategy')}
              >
                Strategy Overview
              </button>
            </div>
            
            {isAdmin && <AdminLogDialog targetUserId={user?.id} />}
          </div>
          
          <div className="tab-content">
            {activeTab === 'today' && (
              <div className="space-y-6">
                <TodaysMissionCard strategy={strategy} loading={loading} />
                <EnhancedWeeklyCalendarGrid strategy={strategy} loading={loading} />
                <ScriptPreviewsSection scripts={scripts} loading={loading} />
              </div>
            )}
            
            {activeTab === 'missions' && (
              <ContentMissionsSection />
            )}
            
            {activeTab === 'strategy' && (
              <StrategyOverviewSection strategy={strategy} loading={loading} />
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/3 space-y-6">
          <ReminderCard 
            reminder={reminder} 
            loading={loading} 
            refetchReminders={handleRefetchReminders}
          />
          <LevelProgressCard loading={loading} />
          <WeeklyConsistencyCard />
        </div>
      </div>
    </div>
  );
};
