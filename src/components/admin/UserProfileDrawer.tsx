
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AdminLogDialog } from "./AdminLogDialog";
import { 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Award,
  BookOpen,
  Flame
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  profile: {
    onboarding_complete: boolean;
    metadata: any;
  };
  progress: {
    current_xp: number;
    current_level: number;
    streak_days: number;
  };
  strategy: {
    niche_topic: string;
    summary: string;
    creator_style: string;
    posting_frequency: string;
  };
}

interface UserProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: UserData;
}

export function UserProfileDrawer({ 
  open, 
  onOpenChange, 
  userData 
}: UserProfileDrawerProps) {
  const { user } = useAuth();
  const [generatedScripts, setGeneratedScripts] = useState<any[]>([]);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userData) {
      fetchUserDetails();
    }
  }, [open, userData]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch generated scripts
      const { data: scripts, error: scriptsError } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });
        
      if (scriptsError) throw scriptsError;
      setGeneratedScripts(scripts || []);
      
      // Fetch content ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', userData.id)
        .order('generated_at', { ascending: false });
        
      if (ideasError) throw ideasError;
      setContentIdeas(ideas || []);
      
      // Fetch reminders
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userData.id)
        .order('reminder_time', { ascending: false });
        
      if (reminderError) throw reminderError;
      setReminders(reminderData || []);
      
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DrawerTitle>
          <DrawerDescription>
            {userData.email}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  General Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{userData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined:</span>
                  <span>{formatDate(userData.created_at).split(',')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Onboarding:</span>
                  <Badge variant={userData.profile.onboarding_complete ? "default" : "outline"}>
                    {userData.profile.onboarding_complete ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant={userData.profile.metadata?.is_admin ? "default" : "outline"} className={userData.profile.metadata?.is_admin ? "bg-socialmize-purple" : ""}>
                    {userData.profile.metadata?.is_admin ? "Admin" : "User"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level:</span>
                    <span className="font-medium">{userData.progress.current_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">XP:</span>
                    <span>{userData.progress.current_xp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Streak:</span>
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span>{userData.progress.streak_days} days</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress to Level {userData.progress.current_level + 1}</span>
                    <span>{userData.progress.current_xp % 100}%</span>
                  </div>
                  <Progress value={userData.progress.current_xp % 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Content Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Niche:</span>
                  <span className="font-medium">{userData.strategy.niche_topic || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style:</span>
                  <span>{userData.strategy.creator_style || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span>{userData.strategy.posting_frequency || "Not set"}</span>
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-muted-foreground mb-1">Summary:</span>
                  <p className="text-xs leading-relaxed">
                    {userData.strategy.summary?.substring(0, 120) || "No strategy generated yet"}
                    {userData.strategy.summary?.length > 120 ? "..." : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="strategy">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="strategy" className="flex-1">Strategy</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
              <TabsTrigger value="reminders" className="flex-1">Reminders</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="strategy">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Strategy</CardTitle>
                  <CardDescription>
                    User's content strategy details and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Strategy Summary</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {userData.strategy.summary || "No strategy summary available"}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Content Ideas</h4>
                        {contentIdeas.length > 0 ? (
                          <div className="space-y-2">
                            {contentIdeas.slice(0, 5).map((idea, index) => (
                              <div key={index} className="p-2 bg-muted rounded-md text-sm">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="mb-1">
                                    {idea.format_type || "General"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(idea.generated_at).split(',')[0]}
                                  </span>
                                </div>
                                <p>{idea.idea}</p>
                              </div>
                            ))}
                            {contentIdeas.length > 5 && (
                              <div className="text-center text-sm text-muted-foreground mt-2">
                                + {contentIdeas.length - 5} more ideas
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No content ideas available</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Scripts</CardTitle>
                  <CardDescription>
                    Content scripts created for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generatedScripts.length > 0 ? (
                        generatedScripts.map((script, index) => (
                          <div key={index} className="border rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {script.format_type}
                                </Badge>
                                <h4 className="font-medium">{script.title}</h4>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(script.created_at).split(',')[0]}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">Hook:</span> {script.hook}
                            </p>
                            <div className="text-sm text-muted-foreground max-h-24 overflow-hidden relative">
                              <span className="font-medium">Content:</span>
                              <p className="whitespace-pre-line">{script.content.substring(0, 150)}...</p>
                              <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-6">
                          No scripts generated yet
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reminders">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reminders</CardTitle>
                  <CardDescription>
                    Recording and posting reminders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-socialmize-purple"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reminders.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Type</th>
                              <th className="text-left font-medium py-2">Message</th>
                              <th className="text-left font-medium py-2">Time</th>
                              <th className="text-left font-medium py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reminders.map((reminder, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">
                                  <Badge variant="outline">
                                    {reminder.reminder_type === 'record' ? 'Record' : 'Post'}
                                  </Badge>
                                </td>
                                <td className="py-2">{reminder.message}</td>
                                <td className="py-2 text-muted-foreground">
                                  {formatDate(reminder.reminder_time)}
                                </td>
                                <td className="py-2">
                                  <Badge variant={reminder.completed ? "default" : reminder.is_active ? "outline" : "secondary"}>
                                    {reminder.completed ? "Completed" : reminder.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-center text-muted-foreground py-6">
                          No reminders set
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Admin Activity</CardTitle>
                    <CardDescription>
                      Log of admin actions on this user
                    </CardDescription>
                  </div>
                  <AdminLogDialog targetUserId={userData.id} />
                </CardHeader>
                <CardContent>
                  <AdminLogsTable userId={userData.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DrawerFooter className="border-t pt-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <AdminLogDialog targetUserId={userData.id} onLogCreated={fetchUserDetails} />
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
