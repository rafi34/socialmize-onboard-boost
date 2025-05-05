
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyData } from "@/types/dashboard";
import { Paperclip, FileText, Loader2, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentGenerationSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
  refetchScripts: () => void;
}

export const ContentGenerationSection = ({ 
  strategy, 
  loading,
  refetchScripts
}: ContentGenerationSectionProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  
  // Content type configuration with icons, descriptions, and weekly counts
  const contentTypeConfig: Record<string, { 
    emoji: string,
    title: string,
    description: string,
    guideLink: string,
    needsTranscript: boolean,
    count?: number
  }> = {
    'Duet': {
      emoji: '🎭',
      title: 'Duet',
      description: 'React to trending content',
      guideLink: '/guides/duet',
      needsTranscript: true,
      count: 2
    },
    'Meme': {
      emoji: '🎞',
      title: 'Meme',
      description: 'Fun, viral short-form video',
      guideLink: '/guides/meme',
      needsTranscript: true,
      count: 1
    },
    'Carousel': {
      emoji: '📸',
      title: 'Carousel',
      description: 'Educational slide deck',
      guideLink: '/guides/carousel',
      needsTranscript: false,
      count: 2
    },
    'Voiceover': {
      emoji: '🎤',
      title: 'Voiceover',
      description: 'Script for voiceover content',
      guideLink: '/guides/voiceover',
      needsTranscript: false,
      count: 1
    },
    'Talking Head': {
      emoji: '🎬',
      title: 'Talking Head',
      description: 'Direct-to-camera script',
      guideLink: '/guides/talking-head',
      needsTranscript: false
    },
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate My Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted animate-pulse rounded"></div>
            <div className="h-20 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy || !strategy.content_types || strategy.content_types.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate My Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete your strategy plan first to unlock content generation.</p>
        </CardContent>
      </Card>
    );
  }

  // Get content types from strategy
  const assignedContentTypes = strategy.content_types || [];
  
  // Handle content generation
  const handleGenerateContent = async (contentType: string) => {
    if (!user || generatingType) return;
    
    setGeneratingType(contentType);
    
    try {
      // Get topic ideas from strategy
      const topicIdeas = strategy.topic_ideas || [];
      
      // Get niche topic from strategy
      const nicheTopic = strategy.niche_topic || "";
      
      // Call the generate-content edge function
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          userId: user.id,
          contentType,
          topicIdeas,
          nicheTopic,
          creatorStyle: strategy.creator_style
        }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "Content Generated",
          description: `Your ${contentType} script has been created!`,
        });
        
        // Refetch scripts to show the new one
        refetchScripts();
      } else {
        throw new Error(data?.message || "Failed to generate content");
      }
    } catch (err: any) {
      console.error("Error generating content:", err);
      
      toast({
        title: "Generation Failed",
        description: err.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Generate My Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Types</TabsTrigger>
            {assignedContentTypes.map((type) => (
              <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {assignedContentTypes.map((type, index) => {
              const config = contentTypeConfig[type] || {
                emoji: '📝',
                title: type,
                description: 'Content format',
                guideLink: '#',
                needsTranscript: false
              };
              
              const weeklyCount = config.count ? `(${config.count} this week)` : '';
              const isGenerating = generatingType === type;
              
              return (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <span>{config.emoji}</span>
                        <span>{config.title} {weeklyCount}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <Button variant="link" size="sm" className="text-socialmize-purple h-auto p-0">
                      📖 How to Guide
                    </Button>
                  </div>
                  
                  {config.needsTranscript ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Upload Video
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Paste Transcript
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
                        onClick={() => handleGenerateContent(type)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>Generate Caption</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button 
                        className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
                        onClick={() => handleGenerateContent(type)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>Generate Script</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
          
          {assignedContentTypes.map((type) => {
            const config = contentTypeConfig[type] || {
              emoji: '📝',
              title: type,
              description: 'Content format',
              guideLink: '#',
              needsTranscript: false
            };
            
            const isGenerating = generatingType === type;
            
            return (
              <TabsContent key={type} value={type}>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{config.emoji}</div>
                    <div>
                      <h2 className="text-xl font-semibold">{config.title}</h2>
                      <p className="text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {config.needsTranscript ? (
                      <>
                        <div className="bg-muted/20 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Upload Video or Transcript</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            For this content type, you'll need to provide a video or transcript first.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4" />
                              Upload Video
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Paste Transcript
                            </Button>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
                          onClick={() => handleGenerateContent(type)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Caption...
                            </>
                          ) : (
                            <>Generate Caption for {config.title}</>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="bg-muted/20 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">AI Script Generator</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Our AI will create a custom script based on your content strategy and topic niche.
                          </p>
                        </div>
                        
                        <Button 
                          className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
                          onClick={() => handleGenerateContent(type)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating {config.title} Script...
                            </>
                          ) : (
                            <>Generate {config.title} Script</>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};
