
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StrategyData } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ScriptsSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const ScriptsSection = ({ strategy, loading }: ScriptsSectionProps) => {
  const [copiedScript, setCopiedScript] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedScript(index);
        toast({
          title: "Script copied!",
          description: "The script has been copied to your clipboard.",
        });
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopiedScript(null), 2000);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
      </div>
    );
  }

  if (!strategy?.starter_scripts?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">No Scripts Available</h3>
        <p className="text-muted-foreground">Please complete the onboarding process to generate your content scripts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {strategy.starter_scripts.map((script, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Script {index + 1}: {script.title}</CardTitle>
            <CardDescription>Ready to shoot!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md whitespace-pre-line">
              {script.script}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="ml-auto flex gap-2 items-center"
              onClick={() => copyToClipboard(script.script, index)}
            >
              {copiedScript === index ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Script</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
