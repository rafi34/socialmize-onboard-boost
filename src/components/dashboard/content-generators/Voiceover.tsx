
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Calendar, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface VoiceoverProps {
  content: any;
}

export function Voiceover({ content }: VoiceoverProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!content || !content.content || !content.content.sections) {
    return <div className="text-muted-foreground text-center py-4">No voiceover script generated yet.</div>;
  }

  const { title, sections, total_duration } = content.content;

  const getFullScript = () => {
    return sections.map((section: any) => section.content).join('\n\n');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullScript()).then(
      () => {
        setCopied(true);
        toast({
          title: "Script copied!",
          description: "The full script has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
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
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{title || "Voiceover Script"}</h3>
        {total_duration && (
          <span className="text-xs bg-muted px-2 py-1 rounded">~{total_duration} seconds</span>
        )}
      </div>
      
      <div className="space-y-4">
        {sections.map((section: any, index: number) => (
          <div key={index} className="border rounded-md p-3">
            <div className="mb-2">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {section.type}
              </span>
            </div>
            <p className="whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={copyToClipboard}
          className="flex items-center gap-1"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Full Script</span>
            </>
          )}
        </Button>
        
        <div className="flex gap-2">
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
    </div>
  );
}
