
import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

interface ChatBubbleProps {
  role: string;
  message: string;
  isLoading?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, message, isLoading = false }) => {
  // Parse message to handle potential Markdown formatting
  const formattedMessage = message.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      <br />
    </React.Fragment>
  ));
  
  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] sm:max-w-[70%]",
          role === "user" ? "flex-row-reverse" : "flex-row",
          "items-start gap-2"
        )}
      >
        {role === "assistant" && (
          <Avatar className="mt-0.5 h-8 w-8 border bg-primary">
            <AvatarFallback className="text-primary-foreground">
              <Bot size={16} />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
            isLoading && "animate-pulse"
          )}
        >
          {formattedMessage}
          {isLoading && (
            <span className="inline-block ml-1">
              <span className="dot-typing"></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
