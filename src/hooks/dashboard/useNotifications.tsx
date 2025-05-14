
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function useNotifications() {
  const [errorShown, setErrorShown] = useState(false);
  const [hasAttemptedRetry, setHasAttemptedRetry] = useState(false);
  const { toast } = useToast();

  const showErrorNotification = useCallback((
    title: string,
    description: string,
    onRetry: () => void
  ) => {
    if (errorShown) return;
    
    toast({
      title,
      description,
      variant: "destructive",
      duration: 8000,
      icon: <RefreshCw className="h-4 w-4 text-red-500" />,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            onRetry();
            setHasAttemptedRetry(true);
          }}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      ),
    });
    
    setErrorShown(true);
  }, [errorShown, toast]);

  const resetErrorState = useCallback(() => {
    setErrorShown(false);
    setHasAttemptedRetry(false);
  }, []);

  return {
    errorShown,
    hasAttemptedRetry,
    showErrorNotification,
    resetErrorState
  };
}
