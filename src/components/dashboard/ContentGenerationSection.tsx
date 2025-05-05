
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StrategyData } from "@/types/dashboard";
import { useContentGenerator } from "@/hooks/useContentGenerator";
import { ContentGeneratorItem } from "./ContentGeneratorItem";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatBubble } from "@/components/strategy-chat/ChatBubble";

interface ContentGenerationSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
  refetchScripts?: () => void;
}

export const ContentGenerationSection = ({ 
  strategy, 
  loading,
  refetchScripts
}: ContentGenerationSectionProps) => {
  const { generateContent, isGenerating, error } = useContentGenerator();
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  
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
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy || !strategy.content_types) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate My Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete your strategy plan first to access content generation.</p>
        </CardContent>
      </Card>
    );
  }

  const handleGenerate = async (params: any) => {
    try {
      setGeneratedResult(null);
      const results = await generateContent(params);
      
      if (results && results.length > 0) {
        // Show the first result
        setGeneratedResult(results[0].content);
        
        // Refresh scripts if callback provided
        if (refetchScripts) {
          refetchScripts();
        }
      }
      
      return results;
    } catch (err) {
      console.error("Error generating content:", err);
      return null;
    }
  };

  // Get content types from strategy
  const assignedContentTypes = strategy.content_types || [];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Generate My Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedResult && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Generated Content:</h3>
            <div className="bg-background rounded-lg overflow-auto max-h-[300px]">
              <ChatBubble
                role="assistant"
                message={generatedResult}
                isLoading={false}
              />
            </div>
          </div>
        )}
        
        {assignedContentTypes.map((type, index) => {
          const config = contentTypeConfig[type] || {
            emoji: '📝',
            title: type,
            description: 'Content format',
            guideLink: '#',
            needsTranscript: false
          };
          
          return (
            <ContentGeneratorItem
              key={index}
              type={type}
              config={config}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              topic={strategy.niche_topic}
              creatorStyle={strategy.creator_style}
            />
          );
        })}
        
        {error && (
          <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
            Error: {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
