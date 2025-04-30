
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

interface RegeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  isFirstGeneration?: boolean;
}

export const RegeneratePlanModal = ({ 
  isOpen, 
  onClose, 
  userId,
  onSuccess,
  isFirstGeneration = false
}: RegeneratePlanModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const regenerateStrategy = async () => {
    setIsLoading(true);
    
    try {
      // Get the user's onboarding answers to pass to the AI function
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('onboarding_answers')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (onboardingError) {
        console.error("Error fetching onboarding data:", onboardingError);
        throw new Error('Failed to fetch onboarding data');
      }
      
      console.log("Onboarding data fetched successfully:", onboardingData);
      console.log("Calling generate-strategy-plan with userId:", userId);
      
      // Call the Supabase Edge Function to regenerate the strategy plan
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-strategy-plan', 
        {
          body: { 
            userId, 
            onboardingData 
          }
        }
      );
      
      if (functionError) {
        console.error("Function error:", functionError);
        throw new Error('Failed to generate strategy plan');
      }
      
      console.log("Strategy plan generation response:", data);
      
      toast({
        title: isFirstGeneration ? "Strategy plan generated" : "Strategy plan regenerated",
        description: "Your content strategy has been updated successfully.",
      });
      
      // Call the success callback to refresh the data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error regenerating strategy:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate your strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onClose();
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
          <AlertDialogAction asChild>
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
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
