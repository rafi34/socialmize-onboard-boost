
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseFullStrategyJson } from "@/utils/parseFullStrategyJson";
import { RefreshCw, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FullStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullPlanText: string;
  onRegenerateClick?: () => void;
}

export const FullStrategyModal = ({
  isOpen,
  onClose,
  fullPlanText,
  onRegenerateClick,
}: FullStrategyModalProps) => {
  const [copied, setCopied] = useState(false);
  const [parsedJson, setParsedJson] = useState<any>(null);

  useEffect(() => {
    if (fullPlanText) {
      try {
        const parsed = parseFullStrategyJson(fullPlanText);
        setParsedJson(parsed);
      } catch (error) {
        console.error("Error parsing strategy JSON:", error);
        setParsedJson(null);
      }
    }
  }, [fullPlanText]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(fullPlanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format the content by type
  const renderFormattedContent = () => {
    if (!parsedJson) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
          <ReactMarkdown>{fullPlanText}</ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {parsedJson.summary && (
          <div>
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <p className="text-muted-foreground">{parsedJson.summary}</p>
          </div>
        )}

        {parsedJson.weeks && parsedJson.weeks.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Weekly Plan</h3>
            <div className="space-y-4">
              {parsedJson.weeks.map((week: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-md p-4 bg-card"
                >
                  <h4 className="font-semibold">
                    Week {week.week || index + 1}
                    {week.focus && `: ${week.focus}`}
                  </h4>
                  {week.description && <p className="mt-1">{week.description}</p>}
                  
                  {week.content_types && (
                    <div className="mt-3">
                      <h5 className="font-medium text-sm">Content Types:</h5>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        {Object.entries(week.content_types).map(
                          ([type, count]: any, idx: number) => (
                            <li key={idx} className="text-sm">
                              {type}: {count}x per week
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {week.example_post_ideas && (
                    <div className="mt-3">
                      <h5 className="font-medium text-sm">Example Ideas:</h5>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        {Object.entries(week.example_post_ideas).map(
                          ([type, ideas]: any, idx: number) => (
                            <li key={idx} className="text-sm">
                              <span className="font-medium">{type}:</span>{" "}
                              {Array.isArray(ideas) ? ideas.join(", ") : ideas}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedJson.topic_ideas && parsedJson.topic_ideas.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Content Ideas</h3>
            <ul className="list-disc pl-5 space-y-1">
              {parsedJson.topic_ideas.map((topic: string, index: number) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your Complete Strategy Plan</DialogTitle>
          <DialogDescription>
            This is your personalized content creation strategy
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          {renderFormattedContent()}
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleCopyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy to Clipboard
              </>
            )}
          </Button>

          {onRegenerateClick && (
            <Button
              variant="default"
              className="bg-socialmize-brand-green hover:bg-socialmize-brand-green/90 flex items-center gap-2"
              onClick={onRegenerateClick}
            >
              <RefreshCw className="h-4 w-4" /> Regenerate Strategy
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
