
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ContentIdea {
  id: string;
  idea: string;
  selected: boolean;
}

const ReviewIdeas = () => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
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
        title: "Generating your content plan",
        description: "We're creating your personalized content strategy based on your selections."
      });
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error generating scripts:', error);
      toast({
        title: "Error generating scripts",
        description: "There was a problem generating your scripts.",
        variant: "destructive"
      });
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Review Content Ideas</h1>
        <p className="text-muted-foreground mb-6">
          Select up to 10 content ideas that resonate with you. These will be used to generate your personalized content plan.
        </p>
        
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm">
            <span className={selectedCount >= 5 ? "text-primary font-medium" : "text-muted-foreground"}>
              Selected: {selectedCount}/10
            </span>
          </p>
          
          <Button onClick={handleGenerateScripts} disabled={selectedCount === 0 || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate My Content Plan
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No content ideas found. Complete your strategy onboarding to generate ideas.
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => navigate('/strategy-chat')}>
                      Go to Strategy Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              ideas.map((idea) => (
                <Card key={idea.id} className={idea.selected ? "border-primary" : ""}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox
                      checked={idea.selected}
                      onCheckedChange={() => toggleSelection(idea.id, idea.selected)}
                      id={`idea-${idea.id}`}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`idea-${idea.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {idea.idea}
                    </label>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/strategy-chat')}>
            Back to Chat
          </Button>
          
          <Button onClick={handleGenerateScripts} disabled={selectedCount === 0 || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate My Content Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewIdeas;
