
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Phase {
  name: string;
  weeklyFocus: string[];
  contentFormats: string[];
  platforms: string[];
  toneGuidance: string;
}

interface MissionMapProps {
  phases: Phase[];
  title?: string;
}

export function MissionMap({ phases, title = "Your Content Mission Map" }: MissionMapProps) {
  if (!phases || phases.length === 0) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No mission map available yet. Complete your strategy chat to generate a personalized content map.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-2">
          {phases.map((phase, index) => (
            <div key={index} className="flex-1 min-w-[250px]">
              <div className="bg-gradient-to-br from-[#22B573]/10 to-[#4C9F85]/5 border border-[#22B573]/20 rounded-lg p-4 h-full">
                <div className="flex items-center mb-3">
                  <div className="bg-[#22B573] text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold mr-2">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-lg">{phase.name}</h3>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Weekly Focus</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.weeklyFocus.map((focus, i) => (
                      <Badge key={i} variant="outline" className="bg-[#22B573]/5 border-[#22B573]/30">
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Content Formats</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.contentFormats.map((format, i) => (
                      <Badge key={i} variant="secondary" className="bg-background/80">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Platforms</p>
                  <div className="flex flex-wrap gap-1">
                    {phase.platforms.map((platform, i) => (
                      <Badge key={i} variant="outline">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tone Guidance</p>
                  <p className="text-sm">{phase.toneGuidance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
