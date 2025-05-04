
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Calendar, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ContentMission {
  id: string;
  title: string;
  hook: string;
  format: string;
  difficulty: string;
  is_completed: boolean;
  is_saved: boolean;
}

export const ContentMissionsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<ContentMission[]>([]);
  const [filter, setFilter] = useState("all");
  const [processingMission, setProcessingMission] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchContentMissions();
    }
  }, [user, filter]);
  
  const fetchContentMissions = async () => {
    setLoading(true);
    try {
      // For this MVP, we'll fetch from generated_scripts table
      // In a full implementation, this would be a dedicated content_missions table
      let query = supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform generated scripts into missions format
      const formattedMissions = data?.map(script => ({
        id: script.id,
        title: script.title,
        hook: script.hook || "No hook available",
        format: script.format_type,
        difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)], // Mock difficulty
        is_completed: false, // For MVP, no completed state stored yet
        is_saved: false // For MVP, no saved state stored yet
      })) || [];
      
      setMissions(formattedMissions);
    } catch (error) {
      console.error("Error fetching content missions:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteMission = async (missionId: string) => {
    if (processingMission) return;
    
    setProcessingMission(missionId);
    try {
      if (!user) return;
      
      // Award XP for completing the mission (using the award-xp function)
      const { data, error } = await supabase.functions.invoke('award-xp', {
        body: { 
          userId: user.id, 
          reminderId: missionId, // Using the mission ID directly for this MVP
          type: 'MISSION_COMPLETED',
          amount: 25 // XP award for content mission completion
        }
      });
      
      if (error) throw error;
      
      // Update local state to show mission completed
      setMissions(prev => 
        prev.map(mission => 
          mission.id === missionId ? { ...mission, is_completed: true } : mission
        )
      );
      
      toast({
        title: "Mission completed!",
        description: data.xpAwarded ? `You earned ${data.xpAwarded} XP` : "Great job staying consistent!",
      });
      
    } catch (error) {
      console.error("Error completing mission:", error);
      toast({
        title: "Error",
        description: "Failed to mark mission as completed",
        variant: "destructive",
      });
    } finally {
      setProcessingMission(null);
    }
  };
  
  const handleSaveMission = (missionId: string) => {
    // Toggle saved state in local UI
    setMissions(prev => 
      prev.map(mission => 
        mission.id === missionId ? { ...mission, is_saved: !mission.is_saved } : mission
      )
    );
    
    toast({
      title: "Mission saved",
      description: "You can find it in your saved missions tab",
    });
  };
  
  const getColorForFormat = (format: string) => {
    const formatMapping = {
      'talking_head': 'socialmize-blue',
      'carousel': 'socialmize-green',
      'meme': 'socialmize-orange',
      'duet': 'socialmize-red',
      'voiceover': 'socialmize-purple',
    };
    
    return formatMapping[format as keyof typeof formatMapping] || 'socialmize-purple';
  };
  
  const getColorForDifficulty = (difficulty: string) => {
    const difficultyMapping = {
      'easy': 'green',
      'medium': 'yellow',
      'hard': 'red',
    };
    
    return difficultyMapping[difficulty as keyof typeof difficultyMapping] || 'gray';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Content Missions</h2>
        </div>
        
        <div className="h-80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-socialmize-purple" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Content Missions</h2>
        <Button 
          onClick={fetchContentMissions}
          variant="outline" 
          size="sm"
        >
          Refresh Missions
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Missions</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {missions.length > 0 ? (
            missions.map(mission => (
              <Card key={mission.id} className="overflow-hidden">
                <div className={`h-1 bg-${getColorForFormat(mission.format)}`} />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge 
                      className={`bg-${getColorForFormat(mission.format)} text-white`}
                    >
                      {mission.format}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`border-${getColorForDifficulty(mission.difficulty)}-500 text-${getColorForDifficulty(mission.difficulty)}-700`}
                    >
                      {mission.difficulty}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2">{mission.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    <strong>Hook:</strong> {mission.hook}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={() => handleCompleteMission(mission.id)}
                      disabled={mission.is_completed || processingMission === mission.id}
                      className={`${mission.is_completed ? 'bg-green-500' : 'bg-socialmize-purple'} hover:opacity-90`}
                      size="sm"
                    >
                      {processingMission === mission.id ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing</>
                      ) : mission.is_completed ? (
                        <><CheckCircle className="h-4 w-4 mr-1" /> Completed</>
                      ) : (
                        "Mark as Completed"
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleSaveMission(mission.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Star className={`h-4 w-4 mr-1 ${mission.is_saved ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      {mission.is_saved ? 'Saved' : 'Save'}
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Add to Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No content missions available yet.</p>
              <Button className="mt-4">Generate New Missions</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          {missions.filter(m => m.is_saved).length > 0 ? (
            <div className="space-y-4">
              {missions.filter(m => m.is_saved).map(mission => (
                <Card key={mission.id} className="overflow-hidden">
                  {/* Similar card layout as above */}
                  <div className={`h-1 bg-${getColorForFormat(mission.format)}`} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge 
                        className={`bg-${getColorForFormat(mission.format)} text-white`}
                      >
                        {mission.format}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2">{mission.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      <strong>Hook:</strong> {mission.hook}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => handleCompleteMission(mission.id)}
                        disabled={mission.is_completed || processingMission === mission.id}
                        className="bg-socialmize-purple hover:opacity-90"
                        size="sm"
                      >
                        Mark as Completed
                      </Button>
                      
                      <Button
                        onClick={() => handleSaveMission(mission.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        Remove from Saved
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No saved missions yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {missions.filter(m => m.is_completed).length > 0 ? (
            <div className="space-y-4">
              {missions.filter(m => m.is_completed).map(mission => (
                <Card key={mission.id} className="overflow-hidden">
                  {/* Similar card layout as above */}
                  <div className={`h-1 bg-${getColorForFormat(mission.format)}`} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge 
                        className={`bg-${getColorForFormat(mission.format)} text-white`}
                      >
                        {mission.format}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-2">{mission.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      <strong>Hook:</strong> {mission.hook}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">No completed missions yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
