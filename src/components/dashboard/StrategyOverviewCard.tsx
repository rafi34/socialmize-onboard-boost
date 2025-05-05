
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, FileText } from "lucide-react";
import { FullStrategyModal } from "./FullStrategyModal";

interface StrategyOverviewCardProps {
  onRegenerateClick?: () => void;
  fullPlanText?: string | null;
  onViewFullPlan?: () => void;
}

export const StrategyOverviewCard = ({ 
  onRegenerateClick,
  fullPlanText,
  onViewFullPlan
}: StrategyOverviewCardProps) => {
  const [showFullStrategy, setShowFullStrategy] = useState(false);

  // Enhanced function to extract a summary from the full plan text
  const getSummaryFromFullPlan = () => {
    if (!fullPlanText) return null;
    
    try {
      // First attempt: Try to clean and parse as JSON
      const cleanedText = cleanJsonText(fullPlanText);
      try {
        const parsedPlan = JSON.parse(cleanedText);
        
        // If we have a summary in the JSON, return it
        if (parsedPlan.summary) return parsedPlan.summary;
        
        // Try to build a summary from other JSON structure elements
        if (parsedPlan.overview) return parsedPlan.overview;
        if (parsedPlan.strategy_summary) return parsedPlan.strategy_summary;
        if (parsedPlan.description) return parsedPlan.description;
        
        // If we have a weeks array, extract info from the first week
        if (parsedPlan.weeks && parsedPlan.weeks.length > 0) {
          const firstWeek = parsedPlan.weeks[0];
          if (firstWeek.description) return firstWeek.description;
          if (firstWeek.focus) return `Week 1 Focus: ${firstWeek.focus}`;
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        // Not valid JSON, fall through to text extraction
      }
      
      // Second attempt: Extract from text
      return extractSummaryFromText(fullPlanText);
    } catch (error) {
      console.error("Error getting summary:", error);
      return null;
    }
  };

  // Helper function to extract summary from plain text
  const extractSummaryFromText = (text: string): string | null => {
    // Look for patterns like "Summary: ..." or "Overview: ..."
    const summaryMatch = text.match(/summary:([^.!?]*[.!?])/i);
    if (summaryMatch && summaryMatch[1].trim().length > 10) {
      return summaryMatch[1].trim();
    }
    
    const overviewMatch = text.match(/overview:([^.!?]*[.!?])/i);
    if (overviewMatch && overviewMatch[1].trim().length > 10) {
      return overviewMatch[1].trim();
    }
    
    // If no clear patterns, get the first few sentences
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      // Get up to first 3 sentences that have content
      const firstSentences = sentences.slice(0, 3).join(". ");
      return firstSentences + (firstSentences.endsWith(".") ? "" : ".");
    }
    
    return null;
  };

  // Enhanced function to clean JSON text that might have formatting
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
    
    // Fix common JSON string issues (escaped quotes, newlines)
    cleaned = cleaned
      .replace(/\\"/g, '"') // Fix escaped quotes inside already escaped content
      .replace(/\\n/g, ' ') // Replace \n with spaces for better readability
      .replace(/\r\n/g, ' ') // Replace Windows line breaks
      .replace(/\n/g, ' '); // Replace Unix line breaks
    
    return cleaned;
  };
  
  const summary = getSummaryFromFullPlan();

  const handleViewFullPlan = () => {
    if (onViewFullPlan) {
      onViewFullPlan();
    } else {
      setShowFullStrategy(true);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-socialmize-brand-green" />
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
              onClick={handleViewFullPlan}
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

      {!onViewFullPlan && (
        <FullStrategyModal 
          isOpen={showFullStrategy}
          onClose={() => setShowFullStrategy(false)}
          fullPlanText={fullPlanText || ""}
          onRegenerateClick={onRegenerateClick}
        />
      )}
    </>
  );
};
