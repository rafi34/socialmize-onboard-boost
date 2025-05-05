
import React, { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  message: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ChatBubble = ({ 
  role, 
  message, 
  isLoading = false,
  error = null,
  onRetry 
}: ChatBubbleProps) => {
  const [expanded, setExpanded] = useState(true);
  const isLongMessage = message.length > 300;
  
  const toggleExpanded = () => setExpanded(!expanded);

  // Attempt to format JSON if message appears to be JSON
  const formattedMessage = React.useMemo(() => {
    if (!message) return message;
    
    // Check if message is likely JSON
    if (message.trim().startsWith('{') && message.trim().endsWith('}')) {
      try {
        const parsedJson = JSON.parse(message);
        // Return formatted JSON string
        return JSON.stringify(parsedJson, null, 2);
      } catch (e) {
        // Not valid JSON, return original message
        return message;
      }
    }
    
    return message;
  }, [message]);

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex flex-col",
        role === "user" ? "bg-[#22B573]/10 ml-auto max-w-[85%] md:max-w-[70%] shadow-sm" : 
        role === "assistant" ? "bg-gradient-to-br from-[#22B573]/10 to-[#4C9F85]/5 border border-[#22B573]/20 mr-auto max-w-[85%] md:max-w-[70%] shadow-lg" : 
        "bg-[#F2F2F2] border border-border/30 mx-auto max-w-[90%] text-muted-foreground"
      )}
    >
      {/* Error state */}
      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto text-xs h-7 px-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </div>
      )}
      
      {/* Message Content */}
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", !expanded && isLongMessage && "line-clamp-3")}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#22B573]" />
            <span className="text-muted-foreground">{message}</span>
          </div>
        ) : (
          <ReactMarkdown 
            className="whitespace-pre-wrap"
            components={{
              pre({node, className, children, ...props}) {
                return (
                  <div className="overflow-auto bg-muted/40 p-2 rounded-md my-2 text-sm max-h-[300px]">
                    <pre className="whitespace-pre-wrap break-words" {...props}>{children}</pre>
                  </div>
                );
              },
              code({node, className, children, ...props}) {
                return (
                  <code className="bg-muted/60 rounded px-1 py-0.5 text-xs" {...props}>{children}</code>
                );
              }
            }}
          >
            {formattedMessage}
          </ReactMarkdown>
        )}
      </div>
      
      {/* Expand/Collapse Button for long messages */}
      {isLongMessage && (
        <button 
          className="text-xs text-[#22B573] hover:text-[#004851] flex items-center self-end mt-2"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
          ) : (
            <>Show more <ChevronDown className="h-3 w-3 ml-1" /></>
          )}
        </button>
      )}
    </div>
  );
};
