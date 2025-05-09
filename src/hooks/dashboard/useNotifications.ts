
import { useState, useCallback } from "react";
import { showNotification } from "@/components/ui/notification-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function useNotifications() {
  const [errorShown, setErrorShown] = useState(false);
  const [hasAttemptedRetry, setHasAttemptedRetry] = useState(false);

  const showErrorNotification = useCallback((
    title: string,
    description: string,
    onRetry: () => void
  ) => {
    if (errorShown) return;
    
    showNotification({
      title,
      description,
      type: "error",
      duration: 8000,
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
  }, [errorShown]);

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
