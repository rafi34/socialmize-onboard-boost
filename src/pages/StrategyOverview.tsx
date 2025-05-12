import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StrategyOverviewCard } from "@/components/strategy/StrategyOverviewCard";
import { StrategyVisualization } from "@/components/strategy/StrategyVisualization";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, FileText, BarChart2, Zap, TrendingUp, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLogDialog } from "@/components/admin/AdminLogDialog";

const StrategyOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [usedTopicsCount, setUsedTopicsCount] = useState(0);
  const [totalTopicsCount, setTotalTopicsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingAnswers = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('onboarding_answers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Error checking onboarding answers:', error);
        return;
      }
      if (!data) {
        navigate('/onboarding');
        return;
      }
      // Only fetch strategy data if onboarding answers exist
      fetchStrategyData();
      fetchTopicsData();
      checkAdminStatus();
    };
    if (user && user.id) {
      checkOnboardingAnswers();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user?.id });
      
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchStrategyData = async () => {
    try {
      const { data, error } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setStrategy({
          experience_level: data.experience_level || "",
          content_types: data.content_types as string[] || [],
          weekly_calendar: data.weekly_calendar as Record<string, string[]> || {},
          posting_frequency: data.posting_frequency || "",
          creator_style: data.creator_style || "",
          content_breakdown: {},
          full_plan_text: data.full_plan_text,
          niche_topic: data.niche_topic,
          topic_ideas: data.topic_ideas as string[],
          summary: data.summary
        });

        // Update total topics count
        setTotalTopicsCount(data.topic_ideas ? (data.topic_ideas as string[]).length : 0);
      }
    } catch (error) {
      console.error("Error fetching strategy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicsData = async () => {
    try {
      const { count, error } = await supabase
        .from("used_topics")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user?.id);

      if (error) throw error;
      
      setUsedTopicsCount(count || 0);
    } catch (error) {
      console.error("Error fetching used topics count:", error);
    }
  };

  const handleEditStrategy = () => {
    // Here you would navigate to the onboarding process or a dedicated edit page
    console.log("Edit strategy clicked");
  };

  // Simulate some key metrics for the strategy dashboard
  const keyMetrics = [
    { 
      title: "Content Consistency", 
      value: `${Math.round((usedTopicsCount / Math.max(1, totalTopicsCount)) * 100)}%`, 
      description: "Based on your topic usage",
      icon: <Activity className="h-5 w-5 text-socialmize-purple" />
    },
    { 
      title: "Strategy Completion", 
      value: strategy?.weekly_calendar ? "Active" : "In Progress", 
      description: "Your content plan status",
      icon: <TrendingUp className="h-5 w-5 text-socialmize-purple" />
    },
    { 
      title: "Content Velocity", 
      value: strategy?.posting_frequency || "Not set", 
      description: "Your posting frequency",
      icon: <Zap className="h-5 w-5 text-socialmize-purple" />
    }
  ];

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <PageHeader 
        title="Strategy Overview" 
        description="View and manage your content creation strategy"
        actions={
          <div className="flex gap-2">
            {isAdmin && <AdminLogDialog targetUserId={user?.id} />}
            <Button variant="outline" asChild>
              <Link to="/reminders" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/weekly-calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/scripts-library" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Scripts
              </Link>
            </Button>
          </div>
        }
      />
      
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {metric.icon}
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StrategyOverviewCard 
              strategy={strategy}
              loading={loading}
              onEditClick={handleEditStrategy}
              usedTopicsCount={usedTopicsCount}
              totalTopicsCount={totalTopicsCount}
            />
            
            <div className="space-y-6">
              {/* Add strategy management options here */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {strategy && strategy.summary && strategy.full_plan_text && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md mb-3">
                      <h3 className="font-medium text-green-800 dark:text-green-400 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Strategy Confirmed
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Your starter strategy is ready. Create a detailed 30-day content plan now!
                      </p>
                      <Button className="mt-2 bg-green-600 hover:bg-green-700 text-white w-full" asChild>
                        <Link to="/content-planner">
                          Create 30-Day Content Plan
                        </Link>
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="default" className="text-sm bg-socialmize-purple hover:bg-socialmize-purple/90" asChild>
                      <Link to="/content-planner">30-Day Content Planner</Link>
                    </Button>
                    <Button variant="outline" className="text-sm" asChild>
                      <Link to="/review-ideas">Review Content Ideas</Link>
                    </Button>
                    <Button variant="outline" className="text-sm" asChild>
                      <Link to="/generate-scripts">Generate Scripts</Link>
                    </Button>
                    <Button variant="outline" className="text-sm" asChild>
                      <Link to="/strategy-chat">Strategy Chat</Link>
                    </Button>
                    <Button variant="outline" className="text-sm" asChild>
                      <Link to="/topic-suggestions">Topic Suggestions</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <StrategyVisualization 
            strategy={strategy} 
            usedTopicsCount={usedTopicsCount}
            totalTopicsCount={totalTopicsCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyOverview;
