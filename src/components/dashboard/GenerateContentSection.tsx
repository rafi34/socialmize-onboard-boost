
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyData } from "@/types/dashboard";
import { Paperclip, FileText } from "lucide-react";

interface GenerateContentSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const GenerateContentSection = ({ strategy, loading }: GenerateContentSectionProps) => {
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate My Weekly Content</CardTitle>
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

  if (!strategy || !strategy.content_types) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Generate My Weekly Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete your strategy plan first.</p>
        </CardContent>
      </Card>
    );
  }

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

  // Get content types from strategy
  const assignedContentTypes = strategy.content_types || [];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Generate My Weekly Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignedContentTypes.map((type, index) => {
          const config = contentTypeConfig[type] || {
            emoji: '📝',
            title: type,
            description: 'Content format',
            guideLink: '#',
            needsTranscript: false
          };
          
          const weeklyCount = config.count ? `(${config.count} this week)` : '';
          
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
                  <Button className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple">
                    Generate Caption
                  </Button>
                </div>
              ) : (
                <div className="mt-3">
                  <Button className="w-full bg-socialmize-purple hover:bg-socialmize-dark-purple">
                    Generate Script
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
