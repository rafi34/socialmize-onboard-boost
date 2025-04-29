
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContentGenerator, ContentType } from "@/hooks/useContentGenerator";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, Upload, X } from "lucide-react";
import { Duet, Meme, Carousel, Voiceover, TalkingHead } from "@/components/dashboard/content-generators";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StrategyData } from "@/types/dashboard";

interface ContentGeneratorSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
  refetchScripts: () => void;
}

export function ContentGeneratorSection({ strategy, loading, refetchScripts }: ContentGeneratorSectionProps) {
  const [activeTab, setActiveTab] = useState<ContentType>("duet");
  const [input, setInput] = useState<string>("");
  const { generateContent, isGenerating, generatedContent, error } = useContentGenerator();

  const handleSubmit = async () => {
    await generateContent({
      type: activeTab,
      additional_input: input,
      creator_style: strategy?.creator_style
    });
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete your strategy plan first.</p>
        </CardContent>
      </Card>
    );
  }

  const contentTypeEmojis: Record<ContentType, string> = {
    duet: '🎭',
    meme: '🎞',
    carousel: '📸',
    voiceover: '🎤',
    talking_head: '🎬',
  };

  const needsInput = ['duet', 'meme'].includes(activeTab);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Generate Content</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            {Object.entries(contentTypeEmojis).map(([type, emoji]) => (
              <TabsTrigger key={type} value={type} className="flex gap-1">
                <span>{emoji}</span>
                <span className="hidden sm:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="mb-4">
            {needsInput && (
              <div className="mb-4">
                <Textarea 
                  placeholder={activeTab === 'duet' ? 
                    "Paste transcript or describe the video you're dueting with..." : 
                    "Describe your meme video or concept..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-20"
                />
              </div>
            )}

            <Button 
              onClick={handleSubmit} 
              disabled={isGenerating || (needsInput && !input)}
              className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</>
              )}
            </Button>
          </div>

          {/* Content display based on type */}
          <TabsContent value="duet" className="m-0">
            <Duet content={generatedContent} />
          </TabsContent>
          
          <TabsContent value="meme" className="m-0">
            <Meme content={generatedContent} />
          </TabsContent>
          
          <TabsContent value="carousel" className="m-0">
            <Carousel content={generatedContent} />
          </TabsContent>
          
          <TabsContent value="voiceover" className="m-0">
            <Voiceover content={generatedContent} />
          </TabsContent>
          
          <TabsContent value="talking_head" className="m-0">
            <TalkingHead content={generatedContent} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
