
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface RegeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  isFirstGeneration?: boolean;
  onGenerationStart?: () => void;
}

export const RegeneratePlanModal = ({ 
  isOpen, 
  onClose, 
  userId,
  onSuccess,
  isFirstGeneration = false,
  onGenerationStart
}: RegeneratePlanModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const regenerateStrategy = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Close the modal immediately to show loading state in parent component
      if (onGenerationStart) {
        onGenerationStart();
        onClose();
      }
      
      // Show toast to indicate generation has started
      toast({
        title: isFirstGeneration ? "Generating your strategy plan..." : "Regenerating your strategy plan...",
        description: "This might take 15-30 seconds. Please wait while we craft your personalized content plan.",
      });
      
      // Get the user's onboarding answers to pass to the AI function
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (onboardingError) {
        console.error("Error fetching onboarding data:", onboardingError);
        throw new Error('Failed to fetch onboarding data');
      }
      
      if (!onboardingData) {
        console.error("No onboarding data found for user");
        throw new Error('No onboarding data found. Please complete onboarding first.');
      }
      
      console.log("Onboarding data fetched successfully:", onboardingData);
      console.log("Calling generate-strategy-plan with userId:", userId);
      
      // Use supabase.functions.invoke instead of direct fetch for better error handling
      const { data, error } = await supabase.functions.invoke('generate-strategy-plan', {
        body: { 
          userId, 
          onboardingData 
        }
      });
      
      if (error) {
        console.error("Error calling generate-strategy-plan function:", error);
        throw new Error(error.message || "Strategy generation failed");
      }
      
      if (!data) {
        console.error("No data returned from generate-strategy-plan function");
        throw new Error("No response from strategy generator");
      }
      
      console.log("Strategy generation response:", data);
      
      if (data.mock) {
        console.log("Using mock strategy data (OpenAI assistant not configured)");
      }
      
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['strategy_profiles']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['strategyPlan', userId]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['planConfirmation', userId]
      });
      
      toast({
        title: isFirstGeneration ? "Strategy plan generated" : "Strategy plan regenerated",
        description: "Your content strategy has been updated successfully.",
      });
      
      // Call the success callback to refresh the data
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000); // Small delay to ensure DB updates are complete
      }
    } catch (error: any) {
      console.error("Error regenerating strategy:", error);
      setErrorMessage(error.message || "Failed to regenerate your strategy. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate your strategy. Please try again.",
        variant: "destructive",
      });
      
      if (onClose) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md animate-in scale-in-95">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#FF8C42]" />
            <AlertDialogTitle>
              {isFirstGeneration ? "Generate Your Strategy" : "Regenerate Your Strategy?"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isFirstGeneration 
              ? "Generate a tailored content strategy plan based on your creator profile."
              : "Regenerating your plan will overwrite your current content strategy. You'll receive a new weekly layout and content breakdown based on your latest creator profile."}
          </AlertDialogDescription>
          {!isFirstGeneration && (
            <div className="mt-2 rounded-md border border-[#FF8C42] bg-[#FF8C42]/10 p-3">
              <p className="text-sm font-medium text-[#FF8C42]">
                ⚠️ If you've already started generating or scheduling content based on your current plan, those will not match the new strategy.
              </p>
            </div>
          )}
          {errorMessage && (
            <div className="mt-2 rounded-md border border-red-500 bg-red-500/10 p-3">
              <p className="text-sm font-medium text-red-500">
                Error: {errorMessage}
              </p>
            </div>
          )}
          <p className="mt-4 text-center font-semibold">
            {isFirstGeneration 
              ? "Would you like to generate your personalized strategy plan?"
              : "Are you sure you want to regenerate?"}
          </p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button 
            onClick={regenerateStrategy} 
            disabled={isLoading} 
            className="bg-[#FF8C42] hover:bg-[#FF8C42]/90"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                {isFirstGeneration ? "Generating..." : "Regenerating..."}
              </>
            ) : (
              isFirstGeneration ? "Yes, Generate My Plan" : "Yes, Regenerate My Plan"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
