
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, RefreshCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ContentIdea {
  id: string;
  idea: string;
  selected: boolean;
}

const ReviewIdeas = () => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadContentIdeas();
    }
  }, [user]);

  const loadContentIdeas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_ideas')
        .select('*')
        .eq('user_id', user?.id)
        .order('generated_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setIdeas(data);
        // Count already selected ideas
        const selected = data.filter(idea => idea.selected).length;
        setSelectedCount(selected);
      }
    } catch (error) {
      console.error('Error loading content ideas:', error);
      toast({
        title: "Error loading ideas",
        description: "There was a problem loading your content ideas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContentIdeas = async () => {
    if (!user) return;
    
    try {
      setGenerating(true);
      toast({
        title: "Generating content ideas",
        description: "We're creating fresh content ideas for you. This might take a moment..."
      });

      // Call the edge function to generate new topics
      const { data, error } = await supabase.functions.invoke('refresh-topics', {
        body: { user_id: user.id }
      });
      
      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to generate content ideas");
      }

      // Get the topics from the response
      const topicIdeas = data.topics || [];
      
      // Convert topics to content ideas format for saving
      if (topicIdeas.length > 0) {
        const ideaObjects = topicIdeas.map((idea: string) => ({
          user_id: user.id,
          idea: idea,
          selected: false
        }));
        
        // Save the content ideas to the database
        const { error: saveError } = await supabase
          .from('content_ideas')
          .insert(ideaObjects);
          
        if (saveError) {
          throw saveError;
        }
        
        toast({
          title: "Content ideas generated!",
          description: `${topicIdeas.length} new content ideas have been created.`
        });
        
        // Reload the content ideas
        await loadContentIdeas();
      } else {
        toast({
          title: "No new ideas generated",
          description: "Try updating your strategy profile with more specific information."
        });
      }
    } catch (error: any) {
      console.error('Error generating content ideas:', error);
      toast({
        title: "Error generating ideas",
        description: error.message || "There was a problem generating your content ideas.",
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
        description: "You can select up to 10 content ideas.",
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
        title: "No ideas selected",
        description: "Please select at least one idea to generate scripts.",
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
          description: "Your content plan has been updated with your selected ideas."
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
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple bg-clip-text text-transparent">Your Personalized Content Plan</h1>
          <p className="text-muted-foreground">
            Here are content ideas based on your strategy. Select up to 10 that best represent your brand's voice.
          </p>
        </div>
        
        <div className="mb-6 glass-panel rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Selected: {selectedCount}/10
              </span>
              <span className="text-sm text-muted-foreground">
                {selectedCount === 10 ? "Maximum selected" : `${10 - selectedCount} more available`}
              </span>
            </div>
            <Progress value={selectedCount * 10} className="h-2 bg-gray-200" />
          </div>
          
          <Button 
            onClick={handleGenerateScripts} 
            disabled={selectedCount === 0 || saving}
            className="min-w-[200px] bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finalize My Strategy
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-socialmize-purple" />
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="p-6 flex flex-col items-center">
                  <p className="text-center text-muted-foreground mb-4">
                    No content ideas found. Click the button below to generate some ideas based on your strategy profile.
                  </p>
                  <Button 
                    onClick={generateContentIdeas} 
                    className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Ideas...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Generate Content Ideas
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateContentIdeas}
                    disabled={generating}
                    className="text-xs"
                  >
                    {generating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-1 h-3 w-3" />
                    )}
                    Refresh Ideas
                  </Button>
                </div>
                {ideas.map((idea) => (
                  <Card 
                    key={idea.id} 
                    className={`hover:border-socialmize-purple/40 transition-all duration-200 ${
                      idea.selected ? "border-socialmize-purple bg-socialmize-purple/5" : "premium-card"
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="mt-1">
                        <Checkbox
                          checked={idea.selected}
                          onCheckedChange={() => toggleSelection(idea.id, idea.selected)}
                          id={`idea-${idea.id}`}
                          className={idea.selected ? "text-socialmize-purple border-socialmize-purple" : ""}
                        />
                      </div>
                      <label
                        htmlFor={`idea-${idea.id}`}
                        className="text-sm cursor-pointer flex-1 leading-relaxed"
                      >
                        {idea.idea}
                      </label>
                      {idea.selected && (
                        <CheckCircle className="h-5 w-5 text-socialmize-purple shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
        
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
      </div>
    </div>
  );
};

export default ReviewIdeas;
