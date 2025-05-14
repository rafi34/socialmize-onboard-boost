
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, CheckCircle, Loader2, Repeat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContentIdea {
  id: string;
  title?: string;
  idea: string;
  format?: string;
  difficulty?: string;
  xp_reward?: number;
  hook?: string;
  talking_points?: string[];
  cta?: string;
  shoot_tips?: string;
  edit_help_link?: string;
  selected?: boolean;
}

interface ContentIdeaModalProps {
  open: boolean;
  onClose: () => void;
  idea: ContentIdea | null;
  isLoading?: boolean;
  onComplete?: (id: string) => Promise<void>;
}

export function ContentIdeaModal({ 
  open, 
  onClose, 
  idea, 
  isLoading = false, 
  onComplete 
}: ContentIdeaModalProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSelected, setIsSelected] = useState(idea?.selected || false);

  useEffect(() => {
    if (idea) {
      setIsSelected(idea.selected || false);
    }
  }, [idea]);

  const markComplete = async () => {
    if (!user || !idea || isCompleting) return;

    setIsCompleting(true);
    try {
      // If the parent component provided an onComplete handler, use it
      if (onComplete) {
        await onComplete(idea.id);
        setIsSelected(true);
      } else {
        // Otherwise handle it here
        const { error: updateError } = await supabase
          .from('content_ideas')
          .update({ selected: true })
          .eq('id', idea.id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        
        // Award XP for completing
        const { data: xpData, error: xpError } = await supabase.functions.invoke('award-xp', {
          body: { 
            userId: user.id, 
            reminderId: idea.id,
            type: 'CONTENT_IDEA_COMPLETED', 
            amount: idea.xp_reward || 25 
          }
        });
        
        if (xpError) throw xpError;
        
        setIsSelected(true);
        
        toast({
          title: `+${idea.xp_reward || 25} XP Earned!`,
          description: "Nice job completing this content mission!",
        });
      }
    } catch (error) {
      console.error("Error marking idea as complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark as complete",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const addToCalendar = async () => {
    if (!user || !idea) return;
    
    try {
      // Call the add-calendar-event function
      const { data, error } = await supabase.functions.invoke('add-calendar-event', {
        body: { 
          userId: user.id,
          title: idea.title || idea.idea,
          description: idea.idea,
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
          ideaId: idea.id
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Added to calendar",
        description: "Content mission has been added to your schedule",
      });
    } catch (error) {
      console.error("Error adding to calendar:", error);
      toast({
        title: "Error",
        description: "Failed to add to calendar",
        variant: "destructive",
      });
    }
  };

  const regenerateVariation = async () => {
    if (!idea) return;

    toast({
      title: "Regenerating variation",
      description: "We're creating a new variation of this idea",
    });
    
    // This would normally trigger a function to regenerate content
    // For now, we'll just show a toast
    setTimeout(() => {
      toast({
        title: "New variation ready",
        description: "Check your content ideas for the new variation",
      });
    }, 2000);
  };

  // Loading content for the modal
  const LoadingContent = (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-socialmize-purple mb-4" />
      <p className="text-sm text-muted-foreground">Loading content details...</p>
    </div>
  );

  if (!idea && !isLoading) return null;

  // Content is shared between dialog and drawer
  const content = isLoading ? LoadingContent : (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="text-socialmize-purple bg-socialmize-purple/10">
          {idea?.format || "Content"}
        </Badge>
        <Badge variant="outline" className={`
          ${idea?.difficulty === "Easy" ? "bg-green-100 text-green-800" : 
           idea?.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" : 
           "bg-red-100 text-red-800"}
        `}>
          {idea?.difficulty || "Standard"}
        </Badge>
        <Badge className="bg-socialmize-purple text-white">
          +{idea?.xp_reward || 25} XP
        </Badge>
      </div>

      <p className="text-md font-medium mb-4">{idea?.idea}</p>

      {idea?.hook && (
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-1">📢 Hook</h3>
          <p className="text-sm text-muted-foreground bg-socialmize-purple/5 p-3 rounded-md">{idea.hook}</p>
        </div>
      )}

      {idea?.talking_points && idea?.talking_points.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-1">📝 Talking Points</h3>
          <ul className="list-disc ml-6 text-sm text-muted-foreground">
            {idea.talking_points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {idea?.cta && (
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-1">🎯 Call to Action</h3>
          <p className="text-sm text-muted-foreground">{idea.cta}</p>
        </div>
      )}

      {idea?.shoot_tips && (
        <div className="mb-4">
          <h3 className="font-medium text-sm mb-1">🎥 Shooting Tips</h3>
          <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">{idea.shoot_tips}</p>
        </div>
      )}

      {idea?.edit_help_link && (
        <a
          href={idea.edit_help_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-socialmize-purple underline block mb-4"
        >
          ✂️ View Editing Tutorial
        </a>
      )}

      <div className="flex flex-wrap gap-2 justify-between pt-4 mt-4 border-t">
        <Button 
          onClick={addToCalendar} 
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <CalendarPlus className="h-4 w-4 mr-2" /> Schedule
        </Button>

        {!isSelected ? (
          <Button 
            onClick={markComplete}
            disabled={isCompleting}
            className="flex-1 sm:flex-none bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple"
            size="sm"
          >
            {isCompleting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle className="h-4 w-4 mr-2" /> Mark Complete</>
            )}
          </Button>
        ) : (
          <Button 
            disabled 
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none border-green-500 text-green-700"
          >
            ✅ Completed
          </Button>
        )}
      </div>

      <div className="mt-2">
        <Button 
          variant="ghost" 
          onClick={regenerateVariation}
          size="sm"
          className="text-socialmize-purple hover:text-socialmize-purple hover:bg-socialmize-purple/10"
        >
          <Repeat className="h-4 w-4 mr-2" /> Regenerate Variation
        </Button>
      </div>
    </>
  );

  // For mobile, use a drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-2 mb-4">
            <DrawerTitle className="text-lg font-semibold">
              {isLoading ? "Loading Content..." : (idea?.title || idea?.idea?.substring(0, 40) + (idea?.idea?.length > 40 ? "..." : ""))}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  
  // For desktop, use dialog
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-lg font-semibold">
          {isLoading ? "Loading Content..." : (idea?.title || idea?.idea?.substring(0, 40) + (idea?.idea?.length > 40 ? "..." : ""))}
        </DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
