
import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

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
        "my-4 animate-fade-in" // Added vertical spacing and animation
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] sm:max-w-[75%]",
          role === "user" ? "flex-row-reverse" : "flex-row",
          "items-start gap-3" // Increased gap for better spacing
        )}
      >
        {role === "assistant" ? (
          <Avatar className="mt-0.5 h-9 w-9 border border-primary/10 bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple shadow-md">
            <AvatarImage src="/lovable-uploads/195faaef-b539-44ba-a94a-d2449f0cd0c3.png" alt="AI Assistant" />
            <AvatarFallback className="text-primary-foreground">
              <Bot size={18} />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="mt-0.5 h-9 w-9 border border-primary/10 bg-gradient-to-br from-socialmize-green to-socialmize-blue shadow-md">
            <AvatarFallback className="text-primary-foreground">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm md:text-base shadow-md", // Increased padding and rounded corners
            role === "user"
              ? "bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple text-white"
              : "glass-panel border border-border/30 text-foreground",
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
