
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { GeneratedScript } from "@/types/dashboard";

export type ContentType = 'duet' | 'meme' | 'carousel' | 'voiceover' | 'talking_head';

export interface GenerateContentParams {
  type: ContentType;
  additional_input?: string;
  creator_style?: string;
  topic?: string;
}

export function useContentGenerator() {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedScript[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateContent = async ({
    type,
    additional_input = "",
    creator_style = "",
    topic = ""
  }: GenerateContentParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          user_id: userId,
          type,
          additional_input,
          creator_style,
          topic
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to generate content");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to generate content");
      }

      setGeneratedContent(data.results);
      toast({
        title: "Content Generated",
        description: `Your ${type.replace('_', ' ')} content has been successfully generated!`,
      });
      return data.results;
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateContent,
    isGenerating,
    generatedContent,
    error,
  };
}
