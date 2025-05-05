
import React, { useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  message: string;
  isLoading?: boolean;
}

export const ChatBubble = ({ role, message, isLoading = false }: ChatBubbleProps) => {
  const [expanded, setExpanded] = useState(true);
  const isLongMessage = message.length > 300;
  
  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex flex-col",
        role === "user" ? "bg-[#22B573]/10 ml-auto max-w-[85%] md:max-w-[70%] shadow-sm" : 
        role === "assistant" ? "bg-gradient-to-br from-[#22B573]/10 to-[#4C9F85]/5 border border-[#22B573]/20 mr-auto max-w-[85%] md:max-w-[70%] shadow-lg" : 
        "bg-[#F2F2F2] border border-border/30 mx-auto max-w-[90%] text-muted-foreground"
      )}
    >
      {/* Message Content */}
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", !expanded && isLongMessage && "line-clamp-3")}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#22B573]" />
            <span className="text-muted-foreground">{message}</span>
          </div>
        ) : (
          <ReactMarkdown>{message}</ReactMarkdown>
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
