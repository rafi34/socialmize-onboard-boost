
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StrategyData } from "@/types/dashboard";
import { ChatBubble } from "@/components/strategy-chat/ChatBubble";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface StrategySuggestionSectionProps {
  strategy: StrategyData | null;
  loading: boolean;
}

export const StrategySuggestionSection = ({ 
  strategy, 
  loading 
}: StrategySuggestionSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { user } = useAuth();

  const generateSuggestion = async () => {
    if (!user || !strategy) return;
    
    setIsGenerating(true);
    setSuggestion(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-strategy-suggestion", {
        body: { 
          userId: user.id,
          nicheTopic: strategy.niche_topic,
          contentTypes: strategy.content_types,
          creatorStyle: strategy.creator_style
        }
      });
      
      if (error) throw error;
      
      if (data?.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        throw new Error("No suggestion received");
      }
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast({
        title: "Failed to generate suggestion",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Strategy Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Strategy Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Complete your strategy plan first to access content suggestions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Strategy Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestion ? (
          <div className="mb-4 bg-accent/50 rounded-lg p-4">
            <ChatBubble
              role="assistant"
              message={suggestion}
              isLoading={false}
            />
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSuggestion(null)}
                className="mr-2"
              >
                Dismiss
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={generateSuggestion}
              >
                New Suggestion
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Get personalized strategy suggestions for your {strategy.niche_topic || "content"} based on your creator profile.
            </p>
            <Button
              onClick={generateSuggestion}
              disabled={isGenerating}
              className="bg-socialmize-purple hover:bg-socialmize-dark-purple"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestion
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
