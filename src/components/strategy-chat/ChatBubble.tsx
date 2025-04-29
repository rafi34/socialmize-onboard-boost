
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
      {i < message.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
  
  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start",
        "my-2" // Added vertical spacing between messages
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] sm:max-w-[70%]",
          role === "user" ? "flex-row-reverse" : "flex-row",
          "items-start gap-3" // Increased gap for better spacing
        )}
      >
        {role === "assistant" && (
          <Avatar className="mt-0.5 h-9 w-9 border border-primary/10 bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple shadow-sm">
            <AvatarFallback className="text-primary-foreground">
              <Bot size={18} />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-sm", // Increased padding and rounded corners
            role === "user"
              ? "bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple text-white"
              : "bg-card border border-border/40 text-foreground",
            isLoading && "animate-pulse"
          )}
        >
          <div className="leading-relaxed">
            {formattedMessage}
          </div>
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
