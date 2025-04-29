
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedScript } from "@/types/dashboard";

interface ScriptPreviewsSectionProps {
  scripts: GeneratedScript[] | null;
  loading: boolean;
}

export const ScriptPreviewsSection = ({ scripts, loading }: ScriptPreviewsSectionProps) => {
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-12 bg-muted animate-pulse rounded"></div>
            <div className="h-12 bg-muted animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scripts || scripts.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2">No scripts generated yet.</p>
          <Button>Generate Your First Script</Button>
        </CardContent>
      </Card>
    );
  }

  const formatTypeEmojis: Record<string, string> = {
    'Duet': '🎭',
    'Meme': '🎞',
    'Carousel': '📸',
    'Voiceover': '🎤',
    'Talking Head': '🎬',
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Scripts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {scripts.slice(0, 5).map((script, index) => (
          <div key={index} className="flex items-center justify-between border rounded p-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{formatTypeEmojis[script.format_type] || '📝'}</span>
              <div>
                <p className="font-medium text-sm">{script.title}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{script.hook}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Use Now</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
