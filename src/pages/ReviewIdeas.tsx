
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MissionCard } from "@/components/missions/MissionCard";
import { MissionFilters } from "@/components/missions/MissionFilters";
import { MissionProgress } from "@/components/missions/MissionProgress";

interface ContentIdea {
  id: string;
  idea: string;
  selected: boolean;
  format_type?: string;
  difficulty?: string;
  xp_reward?: number;
  generated_at?: string;
  user_id: string;
}

const ReviewIdeas = () => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [formatFilter, setFormatFilter] = useState("all");
  const [progressData, setProgressData] = useState({
    currentXp: 0,
    currentLevel: 1,
    xpToNextLevel: 100
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadContentIdeas();
      loadProgressData();
    }
  }, [user]);

  useEffect(() => {
    filterIdeas();
  }, [ideas, formatFilter]);

  const filterIdeas = () => {
    if (formatFilter === "all") {
      setFilteredIdeas(ideas);
    } else {
      setFilteredIdeas(ideas.filter(idea => idea.format_type === formatFilter));
    }
  };

  const loadProgressData = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_tracking')
        .select('current_xp, current_level')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        const xpToNext = (data.current_level || 1) * 100;
        
        setProgressData({
          currentXp: data.current_xp || 0,
          currentLevel: data.current_level || 1,
          xpToNextLevel: xpToNext
        });
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const loadContentIdeas = async () => {
    try {
      setLoading(true);
      
      console.log("Loading content ideas for user:", user?.id);
      
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user?.id)
        .order('generated_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Content ideas loaded:", data?.length || 0);
      
      if (data && data.length > 0) {
        const enhancedIdeas = data.map(idea => ({
          ...idea,
          format_type: idea.format_type || getRandomFormat(),
          difficulty: idea.difficulty || getRandomDifficulty(),
          xp_reward: idea.xp_reward || getRandomXp()
        }));
        
        setIdeas(enhancedIdeas);
        
        // Count already selected ideas
        const selected = enhancedIdeas.filter(idea => idea.selected).length;
        setSelectedCount(selected);
      } else if (user) {
        // No ideas found, try to generate some automatically
        generateContentIdeas();
      }
    } catch (error) {
      console.error('Error loading content ideas:', error);
      toast({
        title: "Error loading missions",
        description: "There was a problem loading your content missions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRandomFormat = () => {
    const formats = ["Video", "Carousel", "Talking Head", "Meme", "Duet"];
    return formats[Math.floor(Math.random() * formats.length)];
  };
  
  const getRandomDifficulty = () => {
    const difficulties = ["Easy", "Medium", "Hard"];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  };
  
  const getRandomXp = () => {
    return [25, 50, 75, 100][Math.floor(Math.random() * 4)];
  };

  const generateContentIdeas = async () => {
    if (!user) return;
    
    try {
      setGenerating(true);
      toast({
        title: "Generating content missions",
        description: "We're creating fresh mission ideas for you. This might take a moment..."
      });

      // Call the edge function to generate new topics
      const { data, error } = await supabase.functions.invoke('refresh-topics', {
        body: { userId: user.id }
      });
      
      if (error) {
        throw error;
      }

      // Get the topics from the response
      const topicIdeas = data.topics || [];
      
      if (topicIdeas.length > 0) {
        console.log("Successfully generated content ideas, reloading...");
        await loadContentIdeas();
        
        toast({
          title: "Content missions generated!",
          description: `${topicIdeas.length} new mission ideas have been created.`
        });
      } else {
        toast({
          title: "No new missions generated",
          description: "Try updating your strategy profile with more specific information."
        });
      }
    } catch (error: any) {
      console.error('Error generating content ideas:', error);
      toast({
        title: "Error generating missions",
        description: error.message || "There was a problem generating your content missions.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelection = async (id: string, currentlySelected: boolean) => {
    // If we're trying to select and already have 10 selected items, prevent it
    if (!currentlySelected && selectedCount >= 10) {
      toast({
        title: "Selection limit reached",
        description: "You can select up to 10 content missions.",
        variant: "destructive"
      });
      return;
    }
    
    // Update local state optimistically
    const updatedIdeas = ideas.map(idea => 
      idea.id === id ? { ...idea, selected: !currentlySelected } : idea
    );
    
    setIdeas(updatedIdeas);
    setSelectedCount(currentlySelected ? selectedCount - 1 : selectedCount + 1);
    
    try {
      // Update in database
      const { error } = await supabase
        .from('content_ideas')
        .update({ selected: !currentlySelected })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // If we're selecting a mission (not deselecting), update progress data
      if (!currentlySelected) {
        await loadProgressData();
      }
    } catch (error) {
      console.error('Error updating idea selection:', error);
      
      // Revert the local state change on error
      setIdeas(ideas);
      setSelectedCount(currentlySelected ? selectedCount : selectedCount - 1);
      
      toast({
        title: "Error updating selection",
        description: "There was a problem updating your selection.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateScripts = async () => {
    if (selectedCount === 0) {
      toast({
        title: "No missions selected",
        description: "Please select at least one mission to generate scripts.",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      toast({
        title: "Finalizing your content strategy",
        description: "We're updating your personalized content strategy based on your selections."
      });
      
      // Get selected ideas
      const selectedIdeas = ideas.filter(idea => idea.selected);
      console.log("Selected ideas for content plan:", selectedIdeas);
      
      // Update the strategy profile with the selected ideas
      const { data: strategyData, error: fetchError } = await supabase
        .from('strategy_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (strategyData) {
        // Update the strategy profile with the selected ideas
        const updatedTopicIdeas = selectedIdeas.map(idea => idea.idea);
        
        const { error: updateError } = await supabase
          .from('strategy_profiles')
          .update({ 
            topic_ideas: updatedTopicIdeas,
          })
          .eq('id', strategyData.id);
          
        if (updateError) {
          throw updateError;
        }
        
        toast({
          title: "Content strategy updated!",
          description: "Your content plan has been updated with your selected missions."
        });
      }
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error generating content plan:', error);
      toast({
        title: "Error finalizing content plan",
        description: "There was a problem updating your content strategy.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel mb-8 p-6 rounded-xl">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple bg-clip-text text-transparent">
            Your Level {progressData.currentLevel} Content Missions
          </h1>
          <p className="text-muted-foreground">
            Complete these missions to create engaging content and level up your creator journey.
          </p>
        </div>
        
        <MissionProgress 
          completedCount={selectedCount}
          totalCount={10}
          currentLevel={progressData.currentLevel}
          currentXp={progressData.currentXp}
          xpToNextLevel={progressData.xpToNextLevel}
        />
        
        <MissionFilters 
          onFilterChange={setFormatFilter}
          onRefresh={generateContentIdeas}
          isRefreshing={generating}
        />
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-socialmize-purple" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIdeas.length === 0 && (
              <div className="text-center py-10 glass-panel rounded-xl">
                <h3 className="text-lg font-semibold mb-2">No missions found</h3>
                {formatFilter !== "all" ? (
                  <p className="text-muted-foreground mb-6">
                    No {formatFilter} missions available. Try a different filter or generate new missions.
                  </p>
                ) : (
                  <p className="text-muted-foreground mb-6">
                    You don't have any content missions yet. Generate some to get started!
                  </p>
                )}
                
                <Button 
                  onClick={generateContentIdeas} 
                  className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Missions...
                    </>
                  ) : (
                    "Generate Content Missions"
                  )}
                </Button>
              </div>
            )}
            
            {filteredIdeas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredIdeas.map((idea) => (
                  <MissionCard 
                    key={idea.id}
                    id={idea.id}
                    idea={idea.idea}
                    selected={idea.selected}
                    format={idea.format_type}
                    xpReward={idea.xp_reward}
                    difficulty={idea.difficulty}
                    onToggleSelection={toggleSelection}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {filteredIdeas.length > 0 && (
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => navigate('/strategy-chat')}>
              Back to Strategy
            </Button>
            
            <Button 
              onClick={handleGenerateScripts} 
              disabled={selectedCount === 0 || saving}
              className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalize My Strategy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewIdeas;
