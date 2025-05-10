
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StrategyChatHeaderProps {
  hasExistingChat: boolean;
  sessionStarted: boolean;
  onBackToDashboard: () => void;
  onNewSession: () => void;
  onEndSession: () => void;
}

export const StrategyChatHeader = ({ 
  hasExistingChat,
  sessionStarted, 
  onBackToDashboard, 
  onNewSession,
  onEndSession
}: StrategyChatHeaderProps) => {
  return (
    <div className="premium-header p-4 md:p-6 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/20 shadow-sm">
      <div className="max-w-3xl mx-auto flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-3" 
          onClick={onBackToDashboard}
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-[#0540F2] to-[#446FF2] bg-clip-text text-transparent flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-[#446FF2]" />
            Strategy Session
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Let's build your personalized content strategy</p>
        </div>
        
        <div className="ml-auto flex gap-2">
          {/* End Session Button (only shown if session is started) */}
          {sessionStarted && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onEndSession}
            >
              End Session
            </Button>
          )}
          
          {/* New Session Button (only shown if there's an existing chat) */}
          {hasExistingChat && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onNewSession}
            >
              New Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
