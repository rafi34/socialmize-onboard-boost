
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FullStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullPlanText?: string | null;
}

export const FullStrategyModal = ({ isOpen, onClose, fullPlanText }: FullStrategyModalProps) => {
  // Function to preserve line breaks in the text
  const formatPlanText = (text?: string | null) => {
    if (!text) return <p className="text-muted-foreground">No strategy plan available.</p>;

    // Split by line break and map each line to a paragraph
    return text.split("\n").map((line, index) => (
      <p key={index} className={`${line.trim().length === 0 ? 'my-4' : 'my-2'}`}>
        {line}
      </p>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Your Full Strategy Plan</DialogTitle>
          </div>
          <DialogDescription>
            Here's your complete tailored content strategy to grow your Instagram based on your onboarding profile.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-4 max-h-[50vh]">
          <div className="px-1 space-y-1 whitespace-pre-line">
            {formatPlanText(fullPlanText)}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
