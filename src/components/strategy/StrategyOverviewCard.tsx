
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Target, Palette, Calendar, Grid2X2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StrategyData } from "@/types/dashboard";
import { FullStrategyModal } from "@/components/dashboard/FullStrategyModal";

interface StrategyOverviewCardProps {
  strategy: StrategyData | null;
  loading: boolean;
  onEditClick?: () => void;
  usedTopicsCount?: number;
  totalTopicsCount?: number;
}

export const StrategyOverviewCard = ({ 
  strategy, 
  loading, 
  onEditClick,
  usedTopicsCount = 0,
  totalTopicsCount = 0
}: StrategyOverviewCardProps) => {
  const [showFullStrategy, setShowFullStrategy] = useState(false);
  
  // Calculate completion percentage
  const completionPercentage = totalTopicsCount > 0
    ? Math.round((usedTopicsCount / totalTopicsCount) * 100)
    : 0;

  if (loading) {
    return (
      <Card className="w-full h-48 animate-pulse">
        <CardContent className="p-6">
          <div className="bg-muted h-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">
            No strategy profile found. Complete onboarding to create your strategy.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format content types for display
  const formatContentTypes = (types: string[] = []): string => {
    if (!types || types.length === 0) return "Not specified";
    
    // Return first 3 with ellipsis if more
    if (types.length > 3) {
      return types.slice(0, 3).join(", ") + "...";
    }
    
    return types.join(", ");
  };

  return (
    <>
      <Card className="w-full overflow-hidden border border-socialmize-purple/20">
        <CardHeader className="bg-gradient-to-r from-socialmize-light-purple/20 to-socialmize-purple/10 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-socialmize-purple" />
              Strategy Profile
            </CardTitle>
            {onEditClick && (
              <Button variant="ghost" size="icon" onClick={onEditClick} className="h-8 w-8">
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit Strategy</span>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-socialmize-purple mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Mission</div>
                  <div className="text-sm text-muted-foreground">
                    {strategy.niche_topic || "General content creation"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Palette className="h-5 w-5 text-socialmize-purple mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Creator Style</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {strategy.creator_style || "Not specified"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-socialmize-purple mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Posting Frequency</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {strategy.posting_frequency || "Not specified"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Grid2X2 className="h-5 w-5 text-socialmize-purple mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Content Formats</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.content_types && strategy.content_types.length > 0 ? (
                      strategy.content_types.slice(0, 3).map((type, index) => (
                        <Badge key={index} variant="outline" className="bg-socialmize-light-purple/10">
                          {type}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not specified</span>
                    )}
                    {strategy.content_types && strategy.content_types.length > 3 && (
                      <Badge variant="outline" className="bg-socialmize-light-purple/10">
                        +{strategy.content_types.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {totalTopicsCount > 0 && (
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-medium">Plan Completion</span>
                  <span className="text-muted-foreground">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="mt-1 text-xs text-muted-foreground">
                  {usedTopicsCount} of {totalTopicsCount} topic ideas used
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-3">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setShowFullStrategy(true)}
          >
            <FileText className="h-4 w-4" />
            View Full Strategy Plan
          </Button>
        </CardFooter>
      </Card>

      <FullStrategyModal 
        isOpen={showFullStrategy}
        onClose={() => setShowFullStrategy(false)}
        fullPlanText={strategy?.full_plan_text || ""}
      />
    </>
  );
};
