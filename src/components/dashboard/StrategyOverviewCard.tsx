
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";
import { useState } from "react";
import { FullStrategyModal } from "./FullStrategyModal";

interface StrategyOverviewCardProps {
  onRegenerateClick: () => void;
}

export const StrategyOverviewCard = ({ onRegenerateClick }: StrategyOverviewCardProps) => {
  const [showFullPlan, setShowFullPlan] = useState(false);

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Strategy Plan (Tailored for You)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-medium text-sm mb-2">Content Style</h3>
              <p className="text-sm text-muted-foreground">
                Authentic, educational content focusing on your expertise area
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-medium text-sm mb-2">Posting Frequency</h3>
              <p className="text-sm text-muted-foreground">
                3-5 posts per week for optimal growth and engagement
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-medium text-sm mb-2">Strategy Focus</h3>
              <p className="text-sm text-muted-foreground">
                Building audience authority through consistent, valuable content
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-medium text-sm mb-2">Growth Timeline</h3>
              <p className="text-sm text-muted-foreground">
                First 90 days: Establish foundation and begin growing audience
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowFullPlan(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Full Strategy Plan
          </Button>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onRegenerateClick}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Strategy
          </Button>
        </CardFooter>
      </Card>

      <FullStrategyModal 
        isOpen={showFullPlan} 
        onClose={() => setShowFullPlan(false)} 
        onRegenerateClick={onRegenerateClick}
      />
    </>
  );
};
