
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, FileText } from "lucide-react";
import { FullStrategyModal } from "./FullStrategyModal";

interface StrategyOverviewCardProps {
  onRegenerateClick?: () => void;
  fullPlanText?: string | null;
}

export const StrategyOverviewCard = ({ 
  onRegenerateClick,
  fullPlanText 
}: StrategyOverviewCardProps) => {
  const [showFullStrategy, setShowFullStrategy] = useState(false);

  // Extract a summary from the full plan text
  const getSummaryFromFullPlan = () => {
    if (!fullPlanText) return null;
    
    try {
      // Try to clean and parse as JSON first
      const cleanedText = cleanJsonText(fullPlanText);
      const parsedPlan = JSON.parse(cleanedText);
      
      // If we have a summary in the JSON, return it
      if (parsedPlan.summary) return parsedPlan.summary;
      
      // If no summary in JSON, return null to fall back to other methods
      return null;
    } catch {
      // Not valid JSON, extract the first few sentences
      const sentences = fullPlanText.split(/[.!?]/);
      if (sentences.length > 0) {
        // Get up to first 3 sentences that have content
        const firstSentences = sentences
          .filter(s => s.trim().length > 0)
          .slice(0, 3)
          .join(". ");
        
        return firstSentences + (firstSentences.endsWith(".") ? "" : ".");
      }
      return null;
    }
  };

  // Function to clean JSON text that might have formatting
  const cleanJsonText = (text?: string | null): string => {
    if (!text) return "";
    
    // Remove markdown code block indicators
    let cleaned = text.trim()
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/^```\s*/g, '')      // Remove opening ``` without json
      .replace(/```$/g, '');        // Remove closing ```
    
    // Try to find JSON object boundaries if there's other text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  };
  
  const summary = getSummaryFromFullPlan();

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-socialmize-purple" />
              <CardTitle className="text-lg">Your Strategy Plan</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary ? (
              <p className="text-sm">{summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Your personalized content strategy has been generated.
                View the full plan for detailed guidance on growing your profile.
              </p>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2 flex items-center gap-2"
              onClick={() => setShowFullStrategy(true)}
            >
              <FileText className="h-4 w-4" />
              View Full Strategy Plan
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            size="sm"
            onClick={onRegenerateClick}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Strategy
          </Button>
        </CardFooter>
      </Card>

      <FullStrategyModal 
        isOpen={showFullStrategy}
        onClose={() => setShowFullStrategy(false)}
        fullPlanText={fullPlanText || ""}
        onRegenerateClick={onRegenerateClick}
      />
    </>
  );
};
