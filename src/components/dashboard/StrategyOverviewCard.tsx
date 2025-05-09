

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, RefreshCw, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseFullStrategyJson, getStrategySummary } from "@/utils/parseFullStrategyJson";

interface StrategyOverviewCardProps {
  onRegenerateClick?: () => void;
  fullPlanText?: string;
  onViewFullPlan?: () => void;
  isConfirmed?: boolean;
  onConfirmClick?: () => void;
  strategyType?: string;
}

export const StrategyOverviewCard = ({
  onRegenerateClick,
  fullPlanText,
  onViewFullPlan,
  isConfirmed = false,
  onConfirmClick,
  strategyType = "starter"
}: StrategyOverviewCardProps) => {
  const renderContent = () => {
    if (!fullPlanText) {
      return (
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      );
    }

    // Parse the JSON and extract a readable summary
    const parsedData = parseFullStrategyJson(fullPlanText);
    const summary = getStrategySummary(parsedData, fullPlanText);
    
    return (
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {summary || "Your content strategy includes recommendations based on your creator profile. View the full plan for detailed suggestions."}
        </p>
      </div>
    );
  };

  // Format the strategy type for display with first letter capitalized
  const formattedType = strategyType ? 
    (strategyType.charAt(0).toUpperCase() + strategyType.slice(1)) : 
    "Content";

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            {`Your ${formattedType} Strategy`}
            {isConfirmed && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
          </span>
          {onRegenerateClick && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRegenerateClick}
              className="flex items-center text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderContent()}
        
        <div className="flex flex-wrap gap-2">
          {onViewFullPlan && fullPlanText && (
            <Button variant="outline" size="sm" onClick={onViewFullPlan} className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              View Full Plan
            </Button>
          )}
          
          {!isConfirmed && onConfirmClick && (
            <Button size="sm" onClick={onConfirmClick} className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {`Confirm ${formattedType} Strategy`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const StrategyCardSkeleton = () => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
      </CardContent>
    </Card>
  );
};

