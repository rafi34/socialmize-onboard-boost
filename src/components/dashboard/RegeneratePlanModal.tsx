
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
}

export const RegeneratePlanModal = ({ 
  isOpen, 
  onClose, 
  userId,
  onSuccess 
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
        throw new Error('Failed to fetch onboarding data');
      }
      
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
        throw new Error('Failed to generate strategy plan');
      }
      
      toast({
        title: "Strategy plan regenerated",
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
            <AlertDialogTitle>Regenerate Your Strategy?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Regenerating your plan will overwrite your current content strategy. You'll receive a new weekly layout and content breakdown based on your latest creator profile.
          </AlertDialogDescription>
          <div className="mt-2 rounded-md border border-[#FF8C42] bg-[#FF8C42]/10 p-3">
            <p className="text-sm font-medium text-[#FF8C42]">
              ⚠️ If you've already started generating or scheduling content based on your current plan, those will not match the new strategy.
            </p>
          </div>
          <p className="mt-4 text-center font-semibold">
            Are you sure you want to regenerate?
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
                  Regenerating...
                </>
              ) : (
                "Yes, Regenerate My Plan"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
