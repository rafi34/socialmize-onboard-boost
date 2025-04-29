
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyData } from "@/types/dashboard";

interface StrategyOverviewCardProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const StrategyOverviewCard = ({ strategy, loading }: StrategyOverviewCardProps) => {
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Strategy Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
          <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
          <div className="h-16 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Strategy Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Complete onboarding to generate your strategy.</p>
        </CardContent>
      </Card>
    );
  }

  // Format content types with emojis
  const contentTypeEmojis: Record<string, string> = {
    'Duet': '🎭',
    'Meme': '🎞',
    'Carousel': '📸',
    'Voiceover': '🎤',
    'Talking Head': '🎬',
    'Skit': '🎭',
    'Tutorial': '📚',
  };

  const contentBreakdown = strategy.content_breakdown || {};
  const contentTypes = Object.keys(contentBreakdown);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Strategy Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Posting frequency:</p>
            <p className="font-medium">{strategy.posting_frequency || '3x per week'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Content style:</p>
            <p className="font-medium">{strategy.creator_style || 'Authentic'}</p>
          </div>
        </div>
        
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Weekly content breakdown:</p>
          <div className="grid grid-cols-2 gap-2">
            {contentTypes.length > 0 ? (
              contentTypes.map(type => (
                <div key={type} className="bg-muted p-2 rounded-md flex items-center gap-2">
                  <span>{contentTypeEmojis[type] || '📝'}</span>
                  <span className="font-medium">{type} – {contentBreakdown[type]}/wk</span>
                </div>
              ))
            ) : (
              strategy.content_types?.map((type, index) => (
                <div key={index} className="bg-muted p-2 rounded-md flex items-center gap-2">
                  <span>{contentTypeEmojis[type] || '📝'}</span>
                  <span className="font-medium">{type}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="pt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">View Full Plan</Button>
          <Button variant="outline" size="sm" className="flex-1">Regenerate</Button>
        </div>
      </CardContent>
    </Card>
  );
};
