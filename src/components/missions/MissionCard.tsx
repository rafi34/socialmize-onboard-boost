
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarPlus, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MissionCardProps {
  id: string;
  idea: string;
  selected: boolean;
  format?: string;
  xpReward?: number;
  difficulty?: string;
  onToggleSelection: (id: string, currentlySelected: boolean) => Promise<void>;
}

export const MissionCard = ({ 
  id, 
  idea, 
  selected, 
  format = "Video",
  xpReward = 50,
  difficulty = "Easy",
  onToggleSelection 
}: MissionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { user } = useAuth();
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleAddToCalendar = () => {
    toast({
      title: "Added to calendar",
      description: "This content mission has been added to your schedule",
    });
  };
  
  const handleMarkComplete = async () => {
    if (!user) return;
    
    setCompleting(true);
    try {
      // Mark as selected in database
      await onToggleSelection(id, selected);
      
      // Award XP if not already selected
      if (!selected) {
        const { data, error } = await supabase.functions.invoke('award-xp', {
          body: { 
            userId: user.id, 
            type: 'CONTENT_MISSION_COMPLETED', 
            amount: xpReward 
          }
        });
        
        if (error) throw error;
        
        if (data?.success) {
          toast({
            title: `+${xpReward} XP Earned!`,
            description: "Nice job completing this content mission!",
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      toast({
        title: "Error completing mission",
        description: "There was a problem updating your progress.",
        variant: "destructive"
      });
    } finally {
      setCompleting(false);
    }
  };
  
  const formatIconMap = {
    "Video": "🎬",
    "Carousel": "📱",
    "Meme": "🎭",
    "Duet": "🔄",
    "Talking Head": "🎙️"
  };
  
  const formatIcon = formatIconMap[format as keyof typeof formatIconMap] || "📝";
  const difficultyColor = difficulty === "Easy" ? "bg-green-100 text-green-800" : 
                         difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" : 
                         "bg-red-100 text-red-800";
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      selected ? "border-socialmize-purple bg-socialmize-purple/5" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">{formatIcon}</span>
            <Badge variant="outline" className={difficultyColor}>{difficulty}</Badge>
          </div>
          <div>
            <Badge className="bg-socialmize-purple/20 text-socialmize-purple border-none">
              +{xpReward} XP
            </Badge>
          </div>
        </div>
        
        <h3 className="text-md font-semibold mb-2 leading-snug">{idea}</h3>
        
        <div className="flex items-center justify-between mt-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleToggleExpand}
            className="text-xs flex items-center gap-1 px-2"
          >
            {expanded ? (
              <>Less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>More <ChevronDown className="h-3 w-3" /></>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected}
              id={`mission-${id}`}
              disabled={completing}
              className={selected ? "text-socialmize-purple border-socialmize-purple" : ""}
            />
            <label
              htmlFor={`mission-${id}`}
              className="text-xs cursor-pointer"
              onClick={handleMarkComplete}
            >
              {selected ? "Completed" : "Complete"}
            </label>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-3 pt-3 border-t text-sm space-y-3 text-muted-foreground">
            <div>
              <p className="text-xs font-medium mb-1">Tips:</p>
              <p className="text-xs">Film in good lighting. Keep it under 60 seconds. Ask a question at the end.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs flex-1"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="h-3 w-3 mr-1" /> Schedule
              </Button>
              
              <Button 
                variant="default"
                size="sm"
                className="text-xs flex-1 bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple"
                onClick={handleMarkComplete}
                disabled={completing || selected}
              >
                {completing ? (
                  "Saving..."
                ) : selected ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Done</>
                ) : (
                  "Mark Complete"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
