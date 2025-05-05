
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

export const TopicExplainer = () => {
  return (
    <Card className="mb-8 bg-white/80 backdrop-blur-sm border-socialmize-purple/20">
      <CardContent className="pt-6 px-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              How to Use Topic Suggestions
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-2 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-sm">
                    Topic suggestions are AI-generated based on your creator profile and niche.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            <ul className="list-disc ml-5 text-sm space-y-1 text-muted-foreground">
              <li>Browse through the suggested topics for your next content piece</li>
              <li>Click "Mark as Used" when you create content with a topic</li>
              <li>Use "Refresh Topics" to generate new ideas if none inspire you</li>
              <li>Topics adapt to your style and preferences over time</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
