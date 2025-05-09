
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, StopCircle, Loader2 } from "lucide-react";

interface StartSessionButtonProps {
  onStartSession: () => void;
  onEndSession: () => void;
  isLoading: boolean;
  sessionStarted: boolean;
  hasMessages: boolean;
}

export const StartSessionButton = ({ 
  onStartSession, 
  onEndSession,
  isLoading, 
  sessionStarted,
  hasMessages 
}: StartSessionButtonProps) => {
  return (
    <div className="flex justify-center mt-6">
      {!sessionStarted ? (
        <Button
          onClick={onStartSession}
          disabled={isLoading}
          className="bg-gradient-to-br from-[#1FBF57] to-[#1CB955] hover:opacity-90 transition-all shadow-md px-6 py-3 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Preparing Chat...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Chat
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onEndSession}
          disabled={isLoading}
          variant="secondary"
          className="bg-gradient-to-br from-[#FF5A5A] to-[#FF3131] hover:opacity-90 transition-all shadow-md px-6 py-3 text-lg text-white"
        >
          <StopCircle className="mr-2 h-5 w-5" />
          End Chat
        </Button>
      )}
    </div>
  );
};
