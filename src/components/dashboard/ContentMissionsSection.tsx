
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plus, Rocket, X } from "lucide-react";
import { MissionCard } from "../missions/MissionCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ContentMission {
  id: string;
  idea: string;
  format: string;
  difficulty: string;
  xpReward: number;
  selected: boolean;
}

interface ContentMissionsSectionProps {
  limit?: number;
  viewAllLink?: boolean;
}

export const ContentMissionsSection = ({ 
  limit = 3,
  viewAllLink = true 
}: ContentMissionsSectionProps) => {
  const [missions, setMissions] = useState<ContentMission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchMissions();
    }
  }, [user]);
  
  const fetchMissions = async () => {
    try {
      // In a real app, we would fetch this from the backend
      const { data, error } = await supabase
        .from("content_ideas")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(limit + 5); // Fetch a few extra to show variety
      
      if (error) throw error;
      
      // Convert to ContentMission format and take only the limit
      const formattedMissions: ContentMission[] = (data || [])
        .map(item => ({
          id: item.id,
          idea: item.idea || "Create content about trending topics in your niche",
          format: item.format_type || "Video",
          difficulty: item.difficulty || "Easy",
          xpReward: item.xp_reward || 50,
          selected: item.selected || false
        }))
        .filter(mission => !mission.selected) // Only show unselected missions
        .slice(0, limit);
      
      setMissions(formattedMissions);
    } catch (error) {
      console.error("Error fetching missions:", error);
      toast({
        title: "Error loading missions",
        description: "There was a problem loading your content missions.",
        variant: "destructive"
      });
      
      // Add some fallback data
      setMissions([
        {
          id: "fallback1",
          idea: "Create a 'Day in the Life' video showing your content creation process",
          format: "Video",
          difficulty: "Easy",
          xpReward: 50,
          selected: false
        },
        {
          id: "fallback2",
          idea: "Share your top 3 tools that help you create better content",
          format: "Carousel",
          difficulty: "Medium",
          xpReward: 75, 
          selected: false
        },
        {
          id: "fallback3",
          idea: "Record a duet with a trending video in your niche",
          format: "Duet",
          difficulty: "Easy",
          xpReward: 50,
          selected: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleMission = async (id: string, currentlySelected: boolean) => {
    try {
      // Update local state first for immediate UI feedback
      setMissions(prev => prev.map(mission => 
        mission.id === id 
          ? { ...mission, selected: !currentlySelected } 
          : mission
      ));
      
      // Send update to backend
      const { error } = await supabase
        .from("content_ideas")
        .update({ selected: !currentlySelected })
        .eq("id", id)
        .eq("user_id", user?.id);
        
      if (error) throw error;
      
      // If we're unselecting, no further action needed
      if (currentlySelected) return Promise.resolve();
      
      // If selecting, award XP
      const mission = missions.find(m => m.id === id);
      if (!mission) return Promise.resolve();
      
      const { data, error: xpError } = await supabase.functions.invoke('award-xp', {
        body: { 
          userId: user?.id, 
          type: 'CONTENT_IDEA_COMPLETED', 
          amount: mission.xpReward 
        }
      });
      
      if (xpError) throw xpError;
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error toggling mission:", error);
      // Revert local state change if there was an error
      setMissions(prev => prev.map(mission => 
        mission.id === id 
          ? { ...mission, selected: currentlySelected }
          : mission
      ));
      return Promise.reject(error);
    }
  };
  
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-socialmize-purple" /> 
            Content Missions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
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
            <Rocket className="h-5 w-5 text-socialmize-purple" /> 
            Content Missions
          </CardTitle>
          {viewAllLink && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/missions">View All</a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {missions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active missions</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Get New Missions
              </Button>
            </div>
          ) : (
            missions.map((mission) => (
              <MissionCard
                key={mission.id}
                id={mission.id}
                idea={mission.idea}
                format={mission.format}
                difficulty={mission.difficulty}
                xpReward={mission.xpReward}
                selected={mission.selected}
                onToggleSelection={handleToggleMission}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
