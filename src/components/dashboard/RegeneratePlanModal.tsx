
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
      if (onGenerationStart) {
        onGenerationStart();
        onClose();
      }

      toast({
        title: isFirstGeneration ? "Generating your strategy plan..." : "Regenerating your strategy plan...",
        description: "This might take 15-30 seconds. Please wait while we craft your personalized content plan.",
      });

      const { data: onboardingAnswers, error: onboardingError } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (onboardingError || !onboardingAnswers) {
        console.error("Missing onboarding answers", onboardingError);
        throw new Error("Onboarding data is missing. Please complete the onboarding flow.");
      }

      // Log onboarding data to help with debugging
      console.log("Onboarding data for strategy generation:", onboardingAnswers);

      // Check if onboarding data has all required fields
      if (!onboardingAnswers.creator_mission || !onboardingAnswers.content_format_preference || !onboardingAnswers.posting_frequency_goal) {
        console.error("Incomplete onboarding data", onboardingAnswers);
        throw new Error("Onboarding data is incomplete. Please complete all steps in the onboarding flow.");
      }

      const { error } = await supabase.functions.invoke("generate-strategy-plan", {
        body: {
          userId,
          onboardingData: {
            creator_mission: onboardingAnswers.creator_mission,
            creator_style: onboardingAnswers.creator_style,
            content_formats: onboardingAnswers.content_format_preference,
            posting_frequency_goal: onboardingAnswers.posting_frequency_goal,
            niche_topic: onboardingAnswers.niche_topic,
            experience_level: onboardingAnswers.content_format_preference === "tutorials_howto" ? "intermediate" : "beginner"
          }
        }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['strategy_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['strategyPlan', userId] });
      queryClient.invalidateQueries({ queryKey: ['planConfirmation', userId] });

      toast({
        title: isFirstGeneration ? "Strategy plan generated" : "Strategy plan regenerated",
        description: "Your content strategy has been updated successfully."
      });

      if (onSuccess) setTimeout(onSuccess, 1000);
    } catch (err: any) {
      console.error("❌ Strategy generation error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to regenerate your strategy. Please try again.",
        variant: "destructive",
      });
      setErrorMessage(err.message);
      onClose();
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
