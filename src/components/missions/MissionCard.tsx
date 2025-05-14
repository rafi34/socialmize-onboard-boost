
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";

export interface MissionCardProps {
  title?: string;
  description?: string;
  category?: string;
  dueDate?: Date;
  completed?: boolean;
  action?: {
    text: string;
    href: string;
  };
  // New props for content idea missions
  id?: string;
  idea?: string;
  selected?: boolean;
  format?: string;
  difficulty?: string;
  xpReward?: number;
  onToggleSelection?: (id: string, currentlySelected: boolean) => Promise<void>;
}

export const MissionCard = ({
  title,
  description,
  category = "Content",
  dueDate,
  completed = false,
  action,
  // Add support for content idea missions
  id,
  idea,
  selected,
  format,
  difficulty,
  xpReward,
  onToggleSelection,
}: MissionCardProps) => {
  // Use either the provided completed prop or selected prop
  const isCompleted = completed || selected;
  
  // Handle content idea missions
  const missionTitle = title || idea;
  const missionDescription = description || (format ? `Create a ${format} post` : "Create a post");
  
  const handleToggleSelection = () => {
    if (id && onToggleSelection && selected !== undefined) {
      onToggleSelection(id, selected);
    }
  };

  return (
    <Card className={`border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{missionTitle}</CardTitle>
          <Badge variant={isCompleted ? "outline" : "secondary"} className={`ml-2 ${isCompleted ? 'bg-green-100 text-green-800 border-green-200' : ''}`}>
            {isCompleted ? "Selected" : "Available"}
          </Badge>
        </div>
        {category && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Target className="h-3 w-3" />
            <span>{format || category}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">{missionDescription}</p>
        
        {dueDate && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>Due: {dueDate.toLocaleDateString()}</span>
          </div>
        )}
        
        {xpReward && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            <span>{difficulty || 'Medium'} • {xpReward} XP</span>
          </div>
        )}
      </CardContent>
      
      {/* Support both action link and toggle selection */}
      <CardFooter className="pt-1">
        {action ? (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={action.href}>{action.text}</Link>
          </Button>
        ) : onToggleSelection && id ? (
          <Button 
            variant="outline" 
            size="sm" 
            className={`w-full ${isCompleted ? 'border-green-400 bg-green-100 hover:bg-green-200 text-green-800' : ''}`}
            onClick={handleToggleSelection}
          >
            {isCompleted ? "Deselect Mission" : "Select Mission"}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};
