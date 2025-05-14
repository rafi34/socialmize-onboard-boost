
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface MissionCardProps {
  title: string;
  description: string;
  category?: string;
  dueDate?: Date;
  completed?: boolean;
  action?: {
    text: string;
    href: string;
  };
}

export const MissionCard = ({
  title,
  description,
  category = "Content",
  dueDate,
  completed = false,
  action,
}: MissionCardProps) => {
  return (
    <Card className={`border ${completed ? 'border-green-200 bg-green-50' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant={completed ? "success" : "secondary"} className="ml-2">
            {completed ? "Completed" : "Active"}
          </Badge>
        </div>
        {category && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Target className="h-3 w-3" />
            <span>{category}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {dueDate && (
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            <span>Due: {dueDate.toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
      
      {action && (
        <CardFooter className="pt-1">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to={action.href}>{action.text}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
