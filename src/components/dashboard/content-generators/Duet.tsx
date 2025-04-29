
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Calendar, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DuetProps {
  content: any;
}

export function Duet({ content }: DuetProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!content || !content.content || !content.content.captions) {
    return <div className="text-muted-foreground text-center py-4">No captions generated yet.</div>;
  }

  const captions = content.content.captions;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedIndex(index);
        toast({
          title: "Caption copied!",
          description: "The caption has been copied to your clipboard.",
        });
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopiedIndex(null), 2000);
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Generated Duet Captions</h3>
      
      <div className="space-y-3">
        {captions.map((caption: any, index: number) => (
          <div key={index} className="border rounded-md p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{caption.text}</p>
                {caption.hook_type && (
                  <span className="text-xs text-muted-foreground">Hook type: {caption.hook_type}</span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(caption.text, index)}
                className="ml-2"
              >
                {copiedIndex === index ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Add to Calendar</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
