
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
import { useState, useEffect } from "react";
import { parseFullStrategyJson, strategyJsonToText } from "@/utils/parseFullStrategyJson";

interface FullStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerateClick?: () => void;
  fullPlanText?: string | null;
}

export const FullStrategyModal = ({ isOpen, onClose, fullPlanText, onRegenerateClick }: FullStrategyModalProps) => {
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'readable' | 'structured'>('readable');
  
  // Parse JSON when fullPlanText changes
  useEffect(() => {
    if (!fullPlanText || fullPlanText.trim().length === 0) {
      setParsedJson(null);
      setIsJsonValid(false);
      setJsonError("No strategy plan text available");
      return;
    }

    try {
      const parsed = parseFullStrategyJson(fullPlanText);
      setParsedJson(parsed);
      setIsJsonValid(!!parsed);
      setJsonError(parsed ? null : "Failed to parse strategy data");
    } catch (e: any) {
      console.error("Error parsing JSON plan:", e);
      setParsedJson(null);
      setIsJsonValid(false);
      setJsonError(`Failed to parse as JSON: ${e.message}`);
    }
  }, [fullPlanText]);
  
  // Function to format and display the plan text, supporting both readable and structured modes
  const renderPlanContent = () => {
    if (!fullPlanText || fullPlanText.trim().length === 0) {
      return <p className="text-muted-foreground">No strategy plan available.</p>;
    }

    // Convert to readable text format
    if (displayMode === 'readable') {
      const readableText = strategyJsonToText(parsedJson) || fullPlanText;
      
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {readableText.split("\n").map((line, index) => (
            <p 
              key={index} 
              className={`my-1 ${line.trim().startsWith("-") ? "pl-4" : ""} ${line.trim().startsWith("Phase") || line.trim().startsWith("Week") ? "text-lg font-medium text-socialmize-green mt-4" : ""}`}
            >
              {line || "\u00A0"}
            </p>
          ))}
        </div>
      );
    }
    
    // Display structured data format
    if (isJsonValid && parsedJson && displayMode === 'structured') {
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
              
              {parsedJson.weeks.map((week: any, index: number) => (
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
                          {week.weekly_table.map((item: any, i: number) => (
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
                              {Array.isArray(ideas) && ideas.map((idea: any, j: number) => (
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
          
          {/* Weekly Calendar (alternative format) */}
          {parsedJson.weekly_calendar && typeof parsedJson.weekly_calendar === 'object' && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Weekly Calendar</h3>
              <div className="border rounded-lg p-4">
                {Object.entries(parsedJson.weekly_calendar).map(([day, contentTypes], i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <h4 className="font-medium">{day}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(contentTypes) && contentTypes.map((type: string, j: number) => (
                        <span key={j} className="bg-secondary/30 px-2 py-1 text-sm rounded">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Phases data structure */}
          {parsedJson.phases && Array.isArray(parsedJson.phases) && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Strategy Phases</h3>
              {parsedJson.phases.map((phase: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-bold">{phase.title}</h4>
                  <p className="text-muted-foreground mb-2">{phase.goal}</p>
                  
                  {phase.tactics && (
                    <div className="mt-2">
                      <h5 className="font-medium text-sm mb-1">Tactics:</h5>
                      <ul className="list-disc pl-5">
                        {Array.isArray(phase.tactics) && phase.tactics.map((tactic: string, j: number) => (
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
                {parsedJson.topic_ideas.map((topic: string, i: number) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Fallback for unknown JSON structure */}
          {!parsedJson.weeks && !parsedJson.phases && !parsedJson.topic_ideas && !parsedJson.summary && !parsedJson.weekly_calendar && (
            <div>
              <h3 className="font-medium text-lg mb-2">Strategy Plan</h3>
              <div className="space-y-4">
                {Object.entries(parsedJson).map(([key, value]) => {
                  // Skip internal or technical fields
                  if (key.startsWith('_') || key === 'id') return null;
                  
                  return (
                    <div key={key} className="border p-3 rounded-md">
                      <h4 className="font-medium capitalize mb-1">{key.replace(/_/g, ' ')}</h4>
                      {renderJsonValue(key, value)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    } else if (displayMode === 'structured') {
      // Not valid JSON but user wants structured view
      return (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm">
            <p className="font-medium">Could not parse as structured data</p>
            <p className="text-xs mt-1">Switch to readable view to see the content</p>
          </div>
          <div className="whitespace-pre-wrap">
            <pre className="text-xs overflow-x-auto p-4 bg-gray-50 rounded-md">
              {fullPlanText}
            </pre>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-socialmize-green" />
            <DialogTitle className="text-xl">Your Full Strategy Plan</DialogTitle>
          </div>
          <DialogDescription>
            Here's your complete tailored content strategy to grow your social media based on your onboarding profile.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-2 border-b flex justify-end space-x-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setDisplayMode('readable')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                displayMode === 'readable' 
                  ? 'bg-socialmize-green text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Readable
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('structured')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                displayMode === 'structured' 
                  ? 'bg-socialmize-green text-white' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              Structured
            </button>
          </div>
        </div>
        
        <ScrollArea className="flex-grow px-6 pb-6">
          <div className="space-y-6 py-4">
            {renderPlanContent()}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between p-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onRegenerateClick}
            className="mr-auto"
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

// Helper function to render different types of JSON values
const renderJsonValue = (key: string, value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">Not specified</span>;
  }
  
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {value.map((item, i) => (
          <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
        ))}
      </ul>
    );
  }
  
  if (typeof value === 'object') {
    return (
      <div className="pl-3 border-l-2 border-muted mt-2">
        {Object.entries(value).map(([subKey, subValue]) => (
          <div key={subKey} className="mb-2">
            <span className="font-medium">{subKey.replace(/_/g, ' ')}:</span>{' '}
            {typeof subValue === 'object' ? 
              JSON.stringify(subValue, null, 2) : 
              subValue?.toString()}
          </div>
        ))}
      </div>
    );
  }
  
  return <p>{value.toString()}</p>;
};
