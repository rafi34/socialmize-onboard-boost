
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneratedScript } from "@/types/dashboard";
import { Copy, Eye, FileText, Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ScriptCardProps {
  script: GeneratedScript;
  isFavorite: boolean;
  onToggleFavorite: (script: GeneratedScript, isFavorite: boolean) => void;
}

export const ScriptCard = ({ script, isFavorite, onToggleFavorite }: ScriptCardProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script.content).then(
      () => {
        setIsCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "The script has been copied to your clipboard.",
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      () => {
        toast({
          title: "Failed to copy",
          description: "Could not copy the script to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    
    setIsTogglingFavorite(true);
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_scripts')
          .delete()
          .eq('user_id', user.id)
          .eq('script_id', script.id);
          
        if (error) throw error;
        
        toast({
          title: "Removed from favorites",
          description: "This script has been removed from your favorites.",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_scripts')
          .insert({
            user_id: user.id,
            script_id: script.id
          });
          
        if (error) throw error;
        
        toast({
          title: "Added to favorites",
          description: "This script has been added to your favorites.",
        });
      }
      
      // Call the parent component's handler
      onToggleFavorite(script, !isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Action failed",
        description: "There was a problem updating your favorites.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const formatTypeEmojis: Record<string, string> = {
    'Duet': '🎭',
    'Meme': '🎞',
    'Carousel': '📸',
    'Voiceover': '🎤',
    'Talking Head': '🎬',
  };

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md border-socialmize-purple/10 hover:border-socialmize-purple/30">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-lg">{formatTypeEmojis[script.format_type] || '📝'}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-socialmize-purple/10 text-socialmize-purple">
              {script.format_type}
            </span>
          </div>
          <CardTitle className="text-lg line-clamp-1">{script.title}</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleToggleFavorite}
          className={isFavorite ? "text-yellow-500" : "text-muted-foreground"}
          disabled={isTogglingFavorite}
        >
          <Star className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-1 text-socialmize-purple">Hook</h4>
          <p className="text-sm text-muted-foreground">{script.hook}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1 text-socialmize-purple">Content</h4>
          <p className={`text-sm ${isExpanded ? "" : "line-clamp-4"}`}>
            {script.content}
          </p>
          {script.content.length > 200 && (
            <button 
              className="text-xs text-socialmize-purple mt-1 hover:underline focus:outline-none"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="justify-end gap-2 pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => window.location.href = `/script-preview/${script.id}`}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Preview
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          {isCopied ? "Copied!" : "Copy"}
        </Button>
      </CardFooter>
    </Card>
  );
};
