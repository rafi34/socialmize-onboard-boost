
import { useState, useEffect } from "react";

interface StrategyGenerationStateProps {
  isGeneratingStrategy: boolean;
  waitingMessage: string;
  generationStatus: 'idle' | 'pending' | 'success' | 'error';
  generationError: string | null;
  onRetry: () => void;
}

export const StrategyGenerationState = ({
  isGeneratingStrategy,
  waitingMessage,
  generationStatus,
  generationError,
  onRetry
}: StrategyGenerationStateProps) => {
  
  if (!isGeneratingStrategy) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-socialmize-purple mx-auto"></div>
          <h1 className="text-2xl font-bold">Generating Your Content Strategy</h1>
          <p className="text-lg">{waitingMessage || "Our AI is analyzing your profile..."}</p>
          <p className="text-sm text-muted-foreground">
            This takes about 15–30 seconds. You'll be redirected automatically when it's ready.
          </p>
          {generationStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">There was an issue generating your strategy. We're retrying...</p>
              <button 
                onClick={onRetry}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
              >
                Retry Now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
