import { StrategyData } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { parseFullStrategyJson } from "@/utils/parseFullStrategyJson";

interface StrategyOverviewSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
  onRegenerateClick?: () => void;
}

export const StrategyOverviewSection = ({ strategy, loading, onRegenerateClick }: StrategyOverviewSectionProps) => {
  const [parsedJson, setParsedJson] = useState<any>(null);

  useEffect(() => {
    if (strategy?.full_plan_text) {
      const parsed = parseFullStrategyJson(strategy.full_plan_text);
      setParsedJson(parsed);
    }
  }, [strategy]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading your strategy...</p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">Strategy Not Found</h3>
        <p className="text-muted-foreground mb-6">Please generate your strategy to view your personalized plan.</p>
        {onRegenerateClick && (
          <Button onClick={onRegenerateClick} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate Strategy
          </Button>
        )}
      </div>
    );
  }

  const summary = strategy.summary || parsedJson?.summary || "Your strategy summary will appear here.";

  return (
    <div className="bg-socialmize-light-purple/50 p-6 rounded-lg border border-socialmize-light-purple">
      <h2 className="text-xl font-semibold mb-2">Your Strategy Summary</h2>
      <p className="text-muted-foreground whitespace-pre-wrap mb-4">{summary}</p>

      {parsedJson?.weeks && (
        <div className="mt-6 space-y-6">
          <h3 className="text-lg font-medium">Weekly Content Plan</h3>
          {parsedJson.weeks.map((week: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-md shadow-sm border">
              <h4 className="font-semibold mb-2">Week {week.week}</h4>
              {week.weekly_table && (
                <ul className="list-disc pl-5 space-y-1">
                  {week.weekly_table.map((item: any, i: number) => (
                    <li key={i}><strong>{item.label}</strong>: {item.frequency_per_week}x per week</li>
                  ))}
                </ul>
              )}
              {week.example_post_ideas && (
                <div className="mt-3">
                  <h5 className="font-medium mb-1">Example Post Ideas:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(week.example_post_ideas).map(([type, ideas]: any, idx: number) => (
                      <li key={idx}><strong>{type.replace(/_/g, ' ')}:</strong> {ideas.join(", ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {parsedJson?.topic_ideas && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-2">Top Topic Ideas</h4>
          <ul className="list-disc pl-5 space-y-1">
            {parsedJson.topic_ideas.map((topic: string, index: number) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </div>
      )}

      {onRegenerateClick && (
        <div className="mt-6">
          <Button onClick={onRegenerateClick} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerate Strategy
          </Button>
        </div>
      )}
    </div>
  );
};
