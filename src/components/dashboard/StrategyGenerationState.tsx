
import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, Check, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const [progressValue, setProgressValue] = useState(5);
  
  // Auto-retry logic with exponential backoff
  useEffect(() => {
    if (generationStatus === 'error' && retryAttempts < 3) {
      const retryDelay = Math.pow(2, retryAttempts) * 5000; // 5s, 10s, 20s
      
      setAutoRetrying(true);
      const timer = setTimeout(() => {
        console.log(`Auto-retrying strategy generation (attempt ${retryAttempts + 1})...`);
        onRetry();
        setRetryAttempts(prev => prev + 1);
        setAutoRetrying(false);
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [generationStatus, retryAttempts, onRetry]);
  
  // Progress animation for waiting state
  useEffect(() => {
    if (generationStatus === 'pending') {
      const interval = setInterval(() => {
        setProgressValue(prev => {
          // Slowly increase progress, but never quite reach 100%
          if (prev < 90) {
            return prev + (90 - prev) / 20;
          }
          return prev;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (generationStatus === 'success') {
      setProgressValue(100);
    }
  }, [generationStatus]);
  
  // Manual retry handler
  const handleManualRetry = () => {
    setRetryAttempts(0);
    setProgressValue(5);
    toast({
      title: "Retrying...",
      description: "Attempting to generate your strategy again."
    });
    onRetry();
  };
  
  if (!isGeneratingStrategy) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-background">
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          {generationStatus !== 'error' ? (
            <div className="relative">
              <Progress value={progressValue} className="h-2 w-32 mx-auto mb-4" />
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-socialmize-purple mx-auto"></div>
            </div>
          ) : (
            <div className="bg-red-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          )}
          
          <h1 className="text-2xl font-bold">
            {generationStatus === 'error' 
              ? "Strategy Generation Issue" 
              : "Generating Your Content Strategy"}
          </h1>
          
          {generationStatus === 'error' ? (
            <>
              <div className="text-lg text-red-600">
                {generationError || "We encountered an issue while creating your strategy."}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left">
                <p className="text-sm text-red-800 mb-2">This could be due to:</p>
                <ul className="list-disc text-sm text-red-700 ml-5 space-y-1">
                  <li>Temporary service unavailability</li>
                  <li>Network connection issues</li>
                  <li>Server processing errors</li>
                </ul>
              </div>
              <button 
                onClick={handleManualRetry}
                disabled={autoRetrying}
                className="mt-2 px-4 py-2 bg-socialmize-purple hover:bg-socialmize-dark-purple text-white rounded-md text-sm flex items-center justify-center mx-auto"
              >
                {autoRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying automatically...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Now
                  </>
                )}
              </button>
              {retryAttempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempts: {retryAttempts}/3
                </p>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                <p>If the problem persists, you may need to:</p>
                <ul className="list-disc text-left ml-5 mt-2 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Return later when our services are less busy</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg">{waitingMessage || "Our AI is analyzing your profile..."}</p>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <p className="text-sm">
                  This takes about 15–30 seconds. You'll be redirected automatically when it's ready.
                </p>
              </div>
              <div className="flex justify-center space-x-2 mt-4">
                <div className="px-3 py-1 bg-accent rounded-full flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">
                    {generationStatus === 'pending' ? 'In Progress' : 'Complete'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
