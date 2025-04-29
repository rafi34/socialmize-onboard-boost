
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RocketIcon } from "lucide-react";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  onViewIdeas: () => void;
  ideasCount: number;
}

export function CompletionModal({ open, onClose, onViewIdeas, ideasCount }: CompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-card to-background border-socialmize-light-purple/30">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-socialmize-dark-purple to-socialmize-purple bg-clip-text text-transparent">
            🎉 Strategy Onboarding Complete!
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {ideasCount > 0 
              ? `We've built ${ideasCount} content ideas based on your answers.`
              : "We've built your personalized content strategy based on your answers."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center my-6">
          <div className="h-28 w-28 bg-gradient-to-br from-socialmize-light-purple to-socialmize-purple/20 rounded-full flex items-center justify-center shadow-lg">
            <div className="h-20 w-20 bg-gradient-to-br from-socialmize-purple to-socialmize-dark-purple rounded-full flex items-center justify-center animate-pulse">
              <RocketIcon className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onViewIdeas} 
            size="lg" 
            className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
          >
            Review Content Ideas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
