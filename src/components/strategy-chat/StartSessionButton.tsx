
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface StartSessionButtonProps {
  onStartSession: () => void;
  isLoading: boolean;
  sessionStarted: boolean;
  hasMessages: boolean;
}

export const StartSessionButton = ({ 
  onStartSession, 
  isLoading, 
  sessionStarted,
  hasMessages 
}: StartSessionButtonProps) => {
  if (sessionStarted || !hasMessages) return null;
  
  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={onStartSession}
        disabled={isLoading}
        className="bg-gradient-to-br from-[#1FBF57] to-[#1CB955] hover:opacity-90 transition-all shadow-md px-6 py-3 text-lg"
      >
        <Play className="mr-2 h-5 w-5" />
        Start Session
      </Button>
    </div>
  );
};
