
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

export function useNotifications() {
  const [errorShown, setErrorShown] = useState(false);
  const [hasAttemptedRetry, setHasAttemptedRetry] = useState(false);
  const errorToastShown = useRef(false);

  const showErrorNotification = (
    title: string,
    message: string,
    onRetry?: () => void
  ) => {
    if (errorToastShown.current) return;
    
    toast({
      title: title,
      description: message,
      variant: "destructive",
      action: onRetry ? (
        <ToastAction altText="Retry" onClick={() => {
          setHasAttemptedRetry(true);
          if (onRetry) onRetry();
        }}>
          Retry
        </ToastAction>
      ) : undefined
    });
    
    setErrorShown(true);
    errorToastShown.current = true;
  };

  const showSuccessNotification = (
    title: string,
    message: string
  ) => {
    toast({
      title: title,
      description: message,
    });
  };

  const showInfoNotification = (
    title: string,
    message: string
  ) => {
    toast({
      title: title,
      description: message,
      icon: <Info className="h-4 w-4" />
    });
  };

  const resetErrorState = () => {
    setErrorShown(false);
    setHasAttemptedRetry(false);
    errorToastShown.current = false;
  };

  return {
    errorShown,
    hasAttemptedRetry,
    showErrorNotification,
    showSuccessNotification,
    showInfoNotification,
    resetErrorState
  };
}
