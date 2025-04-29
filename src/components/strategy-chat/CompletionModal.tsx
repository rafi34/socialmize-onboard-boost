
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  onViewIdeas: () => void;
  ideasCount: number;
}

export function CompletionModal({ open, onClose, onViewIdeas, ideasCount }: CompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🎉 You've completed your Strategy Onboarding!
          </DialogTitle>
          <DialogDescription className="text-center">
            {ideasCount > 0 
              ? `We've built ${ideasCount} content ideas based on your answers.`
              : "We've built your personalized content strategy based on your answers."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-4">
          <div className="h-24 w-24 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">🚀</span>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onViewIdeas} size="lg">
            Review Content Ideas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
