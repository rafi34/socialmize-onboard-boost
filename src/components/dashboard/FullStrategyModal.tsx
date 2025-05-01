
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brain, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FullStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerateClick?: () => void;
  fullPlanText?: string | null;
}

export const FullStrategyModal = ({ isOpen, onClose, fullPlanText, onRegenerateClick }: FullStrategyModalProps) => {
  // Function to clean JSON text that might have markdown backticks
  const cleanJsonText = (text?: string | null): string => {
    if (!text) return "";
    
    // Remove markdown code block indicators if present
    const cleaned = text.trim()
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/```$/g, '');        // Remove closing ```
    
    return cleaned;
  };
  
  // Function to format and display the plan text, supporting both JSON and plain text
  const formatPlanText = (text?: string | null) => {
    if (!text || text.trim().length === 0) {
      return <p className="text-muted-foreground">No strategy plan available.</p>;
    }

    try {
      // Clean text of any markdown formatting before parsing JSON
      const cleanedText = cleanJsonText(text);
      console.log("Cleaned text for JSON parsing:", cleanedText.substring(0, 100) + "...");
      
      // Try to parse as JSON
      const parsedJson = JSON.parse(cleanedText);
      console.log("Parsed JSON plan:", parsedJson);
      
      // Format JSON content in a structured way
      return (
        <div className="space-y-6">
          {/* Summary Section */}
          {parsedJson.summary && (
            <div className="bg-secondary/30 p-4 rounded-md border">
              <h3 className="font-medium text-lg mb-2">Strategy Summary</h3>
              <p>{parsedJson.summary}</p>
            </div>
          )}
          
          {/* Weekly Content Plans */}
          {parsedJson.weeks && Array.isArray(parsedJson.weeks) && (
            <div className="space-y-8">
              <h3 className="font-medium text-lg">Weekly Content Plan</h3>
              
              {parsedJson.weeks.map((week, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-bold text-md mb-4">Week {week.week}</h4>
                  
                  {/* Content Types Table */}
                  {week.weekly_table && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/20">
                          <tr>
                            <th className="text-left p-2">Content Type</th>
                            <th className="text-left p-2">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {week.weekly_table.map((item, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="p-2">{item.label}</td>
                              <td className="p-2">{item.frequency_per_week}x per week</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Example Post Ideas */}
                  {week.example_post_ideas && (
                    <div>
                      <h5 className="font-medium mb-2">Example Post Ideas:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(week.example_post_ideas).map(([contentType, ideas], i) => (
                          <div key={i} className="bg-secondary/10 p-3 rounded-md">
                            <h6 className="font-medium mb-1 capitalize">
                              {contentType.replace(/_/g, ' ')}
                            </h6>
                            <ul className="list-disc pl-5 space-y-1">
                              {Array.isArray(ideas) && ideas.map((idea, j) => (
                                <li key={j}>{idea}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Phases data structure (alternative format) */}
          {parsedJson.phases && Array.isArray(parsedJson.phases) && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Strategy Phases</h3>
              {parsedJson.phases.map((phase, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-bold">{phase.title}</h4>
                  <p className="text-muted-foreground mb-2">{phase.goal}</p>
                  
                  {phase.tactics && (
                    <div className="mt-2">
                      <h5 className="font-medium text-sm mb-1">Tactics:</h5>
                      <ul className="list-disc pl-5">
                        {phase.tactics.map((tactic, j) => (
                          <li key={j}>{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Topic Ideas */}
          {parsedJson.topic_ideas && Array.isArray(parsedJson.topic_ideas) && parsedJson.topic_ideas.length > 0 && (
            <div>
              <h3 className="font-medium text-lg mb-2">Topic Ideas</h3>
              <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 gap-2">
                {parsedJson.topic_ideas.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Additional sections - handle if JSON structure is different */}
          {!parsedJson.weeks && !parsedJson.phases && !parsedJson.topic_ideas && !parsedJson.summary && (
            <div>
              <h3 className="font-medium text-lg mb-2">Full Strategy Plan</h3>
              <pre className="whitespace-pre-wrap text-sm bg-secondary/10 p-4 rounded-md overflow-auto">
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.error("Error parsing JSON plan:", e);
      // Not valid JSON, display as plain text with line breaks
      return text.split("\n").map((line, index) => (
        <p key={index} className={`${line.trim().length === 0 ? 'my-4' : 'my-2'}`}>
          {line || "\u00A0"}
        </p>
      ));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Your Full Strategy Plan</DialogTitle>
          </div>
          <DialogDescription>
            Here's your complete tailored content strategy to grow your social media based on your onboarding profile.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-4 max-h-[50vh]">
          <div className="px-1 space-y-4">
            {formatPlanText(fullPlanText)}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onRegenerateClick}
            className="sm:order-1"
            disabled={!onRegenerateClick}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Strategy
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
