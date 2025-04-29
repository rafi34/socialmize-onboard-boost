import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface StrategyData {
  experience_level?: string;
  content_types?: string[];
  weekly_calendar?: Record<string, string[]>;
  starter_scripts?: { title: string; script: string }[];
}

interface ProgressData {
  current_xp: number;
  current_level: number;
  streak_days: number;
  last_activity_date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      setLoading(true);
      
      try {
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
          setStrategy({
            experience_level: strategyData.experience_level,
            content_types: strategyData.content_types,
            weekly_calendar: strategyData.weekly_calendar,
            starter_scripts: strategyData.first_five_scripts
          });
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
            current_xp: progressData.current_xp,
            current_level: progressData.current_level,
            streak_days: progressData.streak_days,
            last_activity_date: progressData.last_activity_date
          });
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
      }
    };
    
    fetchUserData();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to your Creator Dashboard</h1>
        
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="scripts">Content Scripts</TabsTrigger>
            <TabsTrigger value="profile">Creator Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="strategy">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
              </div>
            ) : strategy ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Creator Level</CardTitle>
                    <CardDescription>Based on your onboarding profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-socialmize-purple">
                      {strategy.experience_level || "Beginner"}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Content Types</CardTitle>
                    <CardDescription>Recommended formats for your audience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                      {strategy.content_types?.map((type, index) => (
                        <li key={index}>{type}</li>
                      )) || "Loading content types..."}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Weekly Content Calendar</CardTitle>
                    <CardDescription>Your optimal posting schedule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {strategy.weekly_calendar ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                        {Object.entries(strategy.weekly_calendar).map(([day, posts]) => (
                          <Card key={day} className="p-3">
                            <p className="font-bold text-center mb-2">{day}</p>
                            <ul className="text-sm space-y-1">
                              {posts.map((post, i) => (
                                <li key={i} className="py-1 px-2 bg-muted rounded">{post}</li>
                              ))}
                            </ul>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p>No weekly calendar available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">Strategy Not Generated Yet</h3>
                <p className="text-muted-foreground">Please complete the onboarding process to generate your strategy.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scripts">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
              </div>
            ) : strategy?.starter_scripts?.length ? (
              <div className="space-y-6">
                {strategy.starter_scripts.map((script, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>Script {index + 1}: {script.title}</CardTitle>
                      <CardDescription>Ready to shoot!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-line">
                        {script.script}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No Scripts Available</h3>
                <p className="text-muted-foreground">Please complete the onboarding process to generate your content scripts.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Profile</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                    <div>
                      <p className="font-medium">Account Type</p>
                      <p className="text-muted-foreground">Creator</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Creator Stats</CardTitle>
                  <CardDescription>Your current progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Level</span>
                      <span className="bg-socialmize-light-purple px-3 py-1 rounded-full text-socialmize-purple font-medium">
                        Level {progress?.current_level || 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>XP</span>
                      <span>{progress?.current_xp || 100} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Streak Days</span>
                      <span>{progress?.streak_days || 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Your achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <p className="font-medium">OG Creator</p>
                      <p className="text-xs text-muted-foreground">Completed onboarding</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
