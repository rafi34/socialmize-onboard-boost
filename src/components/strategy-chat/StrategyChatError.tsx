
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface StrategyChatErrorProps {
  errorMessage: string | null;
  onDismiss: () => void;
}

export const StrategyChatError = ({ errorMessage, onDismiss }: StrategyChatErrorProps) => {
  if (!errorMessage) return null;
  
  return (
    <div className="rounded-md bg-destructive/15 p-4 mb-4 flex items-start">
      <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-destructive">Error</p>
        <p className="text-sm text-destructive/90">{errorMessage}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
