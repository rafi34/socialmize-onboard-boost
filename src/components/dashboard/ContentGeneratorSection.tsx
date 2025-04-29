
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TalkingHead, Voiceover, Carousel, Meme, Duet } from "./content-generators";
import { StrategyData, GeneratedScript } from "@/types/dashboard";
import { useContentGenerator, ContentType } from "@/hooks/useContentGenerator";
import { TopicSuggestionSection } from "./TopicSuggestionSection";

interface ContentGeneratorSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
  refetchScripts?: () => void;
}

export const ContentGeneratorSection = ({ strategy, loading, refetchScripts }: ContentGeneratorSectionProps) => {
  const [activeTab, setActiveTab] = useState<ContentType>("talking_head");
  const [additionalInput, setAdditionalInput] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedScript | null>(null);
  const { generateContent, isGenerating } = useContentGenerator();

  const handleGenerate = async () => {
    const content = await generateContent({
      type: activeTab,
      additional_input: additionalInput,
      creator_style: strategy?.creator_style,
      topic: selectedTopic
    });
    
    if (content && content[0]) {
      setGeneratedContent(content[0]);
      // Refetch scripts if refetchScripts is provided
      if (refetchScripts) {
        refetchScripts();
      }
    }
  };

  const getContentComponent = () => {
    if (!generatedContent) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Generate content to see preview</p>
        </div>
      );
    }

    switch (activeTab) {
      case "talking_head":
        return <TalkingHead content={generatedContent} />;
      case "voiceover":
        return <Voiceover content={generatedContent} />;
      case "carousel":
        return <Carousel content={generatedContent} />;
      case "meme":
        return <Meme content={generatedContent} />;
      case "duet":
        return <Duet content={generatedContent} />;
      default:
        return null;
    }
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted animate-pulse rounded"></div>
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
          <p className="text-muted-foreground">Complete your strategy to generate content.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <TopicSuggestionSection onSelectTopic={handleSelectTopic} />
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="talking_head" className="flex-1">Talking Head</TabsTrigger>
              <TabsTrigger value="voiceover" className="flex-1">Voiceover</TabsTrigger>
              <TabsTrigger value="carousel" className="flex-1">Carousel</TabsTrigger>
              <TabsTrigger value="meme" className="flex-1">Meme</TabsTrigger>
              <TabsTrigger value="duet" className="flex-1">Duet</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              <div className="space-y-2">
                {selectedTopic && (
                  <div className="bg-accent p-2 rounded-md mb-3">
                    <Label className="text-sm font-medium">Selected Topic:</Label>
                    <p className="font-medium">{selectedTopic}</p>
                  </div>
                )}
                
                <Label htmlFor="additional-input">Additional Input (Optional)</Label>
                {activeTab === "talking_head" || activeTab === "voiceover" || activeTab === "carousel" ? (
                  <Textarea
                    id="additional-input"
                    placeholder={`Enter specific information for your ${activeTab.replace('_', ' ')} content...`}
                    value={additionalInput}
                    onChange={(e) => setAdditionalInput(e.target.value)}
                    className="min-h-[80px]"
                  />
                ) : (
                  <Input
                    id="additional-input"
                    placeholder={`Enter specific information for your ${activeTab.replace('_', ' ')} content...`}
                    value={additionalInput}
                    onChange={(e) => setAdditionalInput(e.target.value)}
                  />
                )}
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {activeTab.replace('_', ' ')} Content
                  </>
                )}
              </Button>
              
              <div className="mt-6">
                {getContentComponent()}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};
