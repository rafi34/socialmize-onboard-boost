
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { GenerateContentParams, ContentType } from "@/hooks/useContentGenerator";

interface ContentTypeConfig {
  emoji: string;
  title: string;
  description: string;
  guideLink: string;
  needsTranscript: boolean;
  count?: number;
}

interface ContentGeneratorItemProps {
  type: string;
  config: ContentTypeConfig;
  isGenerating: boolean;
  onGenerate: (params: GenerateContentParams) => Promise<any>;
  topic?: string;
  creatorStyle?: string;
}

export const ContentGeneratorItem = ({
  type,
  config,
  isGenerating,
  onGenerate,
  topic = "",
  creatorStyle = ""
}: ContentGeneratorItemProps) => {
  const [additionalInput, setAdditionalInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  
  const handleGenerate = async () => {
    const params: GenerateContentParams = {
      type: type.toLowerCase().replace(" ", "_") as ContentType,
      additional_input: additionalInput,
      creator_style: creatorStyle,
      topic: topic
    };
    
    await onGenerate(params);
    
    // Reset form after successful generation
    setAdditionalInput("");
    setVideoUrl("");
    setExpanded(false);
  };
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  const weeklyCount = config.count ? `(${config.count}× this week)` : '';
  
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-medium flex items-center gap-2">
            <span>{config.emoji}</span>
            <span>{config.title} {weeklyCount}</span>
          </h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button 
          variant="link" 
          size="sm" 
          className="text-socialmize-purple h-auto p-0"
          asChild
        >
          <a href={config.guideLink} target="_blank" rel="noopener noreferrer">
            📖 How to Guide
          </a>
        </Button>
      </div>
      
      {!expanded ? (
        <Button 
          onClick={toggleExpanded}
          variant="outline" 
          size="sm" 
          className="mt-3 w-full flex items-center justify-center gap-1"
        >
          Generate {config.title} <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          {config.needsTranscript ? (
            <>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Video URL or reference" 
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Textarea
                  placeholder={`Enter additional details or transcript for your ${config.title.toLowerCase()} content...`}
                  value={additionalInput}
                  onChange={(e) => setAdditionalInput(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isGenerating}
                  onClick={toggleExpanded}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-socialmize-purple hover:bg-socialmize-dark-purple flex items-center justify-center gap-2"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? "Generating..." : "Generate Caption"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Textarea
                placeholder={`Enter additional details for your ${config.title.toLowerCase()} content...`}
                value={additionalInput}
                onChange={(e) => setAdditionalInput(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={isGenerating}
                  onClick={toggleExpanded}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-socialmize-purple hover:bg-socialmize-dark-purple"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                >
                  {isGenerating ? "Generating..." : "Generate Script"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
