
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

interface ContentIdea {
  id: string;
  idea: string;
}

interface GeneratedScript {
  id: string;
  idea_id: string;
  title: string;
  hook: string;
  content: string;
  created_at: string;
}

const GenerateScripts = () => {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingScripts, setGeneratingScripts] = useState<Record<string, boolean>>({});
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadSelectedIdeas();
      loadExistingScripts();
    }
  }, [user]);

  const loadSelectedIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('content_ideas')
        .select('id, idea')
        .eq('user_id', user?.id)
        .eq('selected', true);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setIdeas(data);
      }
    } catch (error) {
      console.error('Error loading selected ideas:', error);
      toast({
        title: "Error loading ideas",
        description: "There was a problem loading your selected content ideas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setGeneratedScripts(data as GeneratedScript[]);
      }
    } catch (error) {
      console.error('Error loading existing scripts:', error);
    }
  };

  const handleGenerateScript = async (idea: ContentIdea) => {
    if (generatingScripts[idea.id]) return;
    
    // Check if a script has already been generated for this idea
    const existingScript = generatedScripts.find(script => script.idea_id === idea.id);
    if (existingScript) {
      toast({
        title: "Script already generated",
        description: "You've already generated a script for this idea.",
      });
      return;
    }
    
    setGeneratingScripts(prev => ({ ...prev, [idea.id]: true }));
    
    try {
      toast({
        title: "Generating script",
        description: "Creating your content script. This may take a moment...",
      });
      
      // Call the Supabase edge function to generate the script
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          userId: user?.id,
          idea: idea.idea,
          ideaId: idea.id
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.success) {
        // Add the new script to the state
        setGeneratedScripts(prev => [...prev, data.script]);
        
        toast({
          title: "Script generated!",
          description: "Your content script has been created successfully.",
        });
      } else {
        throw new Error("Script generation failed");
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: "Error generating script",
        description: "There was a problem creating your content script.",
        variant: "destructive"
      });
    } finally {
      setGeneratingScripts(prev => ({ ...prev, [idea.id]: false }));
    }
  };

  const isScriptGenerated = (ideaId: string) => {
    return generatedScripts.some(script => script.idea_id === ideaId);
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel mb-8 p-6 rounded-xl">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple bg-clip-text text-transparent">Generate Your Content Scripts</h1>
          <p className="text-muted-foreground">
            We'll create high-quality scripts for each of your selected content ideas.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-socialmize-purple" />
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No content ideas selected. Please go back and select some ideas.
                  </p>
                  <div className="flex justify-center mt-4">
                    <Button onClick={() => navigate('/review-ideas')} className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity">
                      Go to Review Ideas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {ideas.map((idea) => {
                  const scriptGenerated = isScriptGenerated(idea.id);
                  
                  return (
                    <Card 
                      key={idea.id} 
                      className={`transition-all duration-200 ${
                        scriptGenerated ? "border-socialmize-purple/40 bg-socialmize-purple/5" : "premium-card"
                      }`}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{idea.idea}</h3>
                        </div>
                        
                        {scriptGenerated ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-socialmize-purple" />
                            <span className="text-sm font-medium text-socialmize-purple">Generated</span>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => handleGenerateScript(idea)}
                            disabled={generatingScripts[idea.id]}
                            className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
                          >
                            {generatingScripts[idea.id] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Script
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={() => navigate('/review-ideas')}>
                    Back to Ideas
                  </Button>
                  
                  <Button 
                    onClick={handleViewDashboard}
                    className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
                  >
                    View All Scripts
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateScripts;
