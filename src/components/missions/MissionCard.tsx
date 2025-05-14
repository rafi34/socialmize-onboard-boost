
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Lock, CheckCircle, Star } from "lucide-react";

export interface MissionCardProps {
  title: string;
  description?: string;
  status?: 'completed' | 'inProgress' | 'locked';
  difficulty?: 'easy' | 'medium' | 'hard';
  xpReward?: number;
  onClick?: () => void;
  buttonText?: string;
  idea?: string;
  selected?: boolean;
  format?: string;
  onToggleSelection?: (id: string, currentlySelected: boolean) => Promise<void>;
  missionId?: string;
}

export function MissionCard({
  title,
  description,
  status = 'inProgress',
  difficulty = 'medium',
  xpReward = 10,
  onClick,
  buttonText = "Start Mission",
  idea,
  selected = false,
  format,
  onToggleSelection,
  missionId
}: MissionCardProps) {
  
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "secondary";
      case 'inProgress':
        return "outline";
      default:
        return "outline";
    }
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return "text-green-500";
      case 'medium':
        return "text-yellow-500";
      case 'hard':
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleToggleSelection = () => {
    if (onToggleSelection && missionId) {
      onToggleSelection(missionId, !!selected);
    }
  };
  
  return (
    <Card className={`overflow-hidden relative transition-all ${selected ? 'border-blue-400 shadow-md' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {title}
          </CardTitle>
          <Badge variant={getBadgeVariant(status)}>
            {status === 'completed' ? 'Completed' : 
             status === 'inProgress' ? 'In Progress' : 'Locked'}
          </Badge>
        </div>
        {description && (
          <CardDescription className="mt-1.5">{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="text-sm">
        {idea && <p className="text-sm text-gray-600 mb-2">{idea}</p>}
        {format && <Badge variant="outline" className="mb-2">{format}</Badge>}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t bg-muted/30">
        <div className="flex items-center text-sm">
          <Star className="h-4 w-4 text-amber-500 mr-1" />
          <span className="font-medium">{xpReward} XP</span>
          <span className={`ml-3 ${getDifficultyColor(difficulty)}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>
        
        {status === 'locked' ? (
          <Button variant="outline" disabled className="text-xs gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Locked
          </Button>
        ) : onToggleSelection ? (
          <Button 
            variant={selected ? "default" : "outline"} 
            size="sm" 
            className="text-xs gap-1.5"
            onClick={handleToggleSelection}
          >
            {selected ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                Selected
              </>
            ) : (
              <>
                <Lightbulb className="h-3.5 w-3.5" />
                {buttonText || "Select Idea"}
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs gap-1.5"
            onClick={onClick}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {buttonText}
          </Button>
        )}
      </CardFooter>
      
      {selected && (
        <div className="absolute top-0 right-0 bg-blue-500 p-1 rounded-bl">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
      )}
    </Card>
  );
}
