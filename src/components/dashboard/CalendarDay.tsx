
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Check, Edit2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useWeeklyCalendar } from "./WeeklyCalendarDataProvider";

interface CalendarDayProps {
  day: string;
  isToday?: boolean;
  contentTypes?: string[];
  availableContentTypes: string[];
}

export const CalendarDay = ({
  day,
  isToday = false,
  contentTypes = [],
  availableContentTypes
}: CalendarDayProps) => {
  const { updateCalendarData } = useWeeklyCalendar();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(contentTypes);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get abbreviation for day of week
  const dayAbbrev = day.substring(0, 3);
  
  // Format contentTypes for display
  const formatContentTypes = (types: string[]): JSX.Element[] => {
    if (!types || types.length === 0) {
      return [<span key="none" className="text-muted-foreground text-xs italic">No content planned</span>];
    }
    
    return types.map((type, index) => (
      <Badge
        key={`${type}-${index}`}
        variant="outline"
        className="bg-muted/50 text-xs"
      >
        {type}
      </Badge>
    ));
  };
  
  const handleToggleType = (value: string[]) => {
    setSelectedTypes(value);
  };
  
  const handleSave = async () => {
    setIsUpdating(true);
    
    try {
      const success = await updateCalendarData(day, selectedTypes);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving calendar data:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCancel = () => {
    setSelectedTypes(contentTypes);
    setIsEditing(false);
  };

  return (
    <Card className={cn(
      "border",
      isToday && "border-socialmize-purple border-2",
      (!contentTypes || contentTypes.length === 0) && "bg-muted/5"
    )}>
      <CardHeader className={cn(
        "pb-2 pt-3 px-3",
        isToday && "bg-socialmize-purple/10"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-sm flex items-center",
            isToday && "text-socialmize-purple font-bold"
          )}>
            <span className="text-lg mr-1">{dayAbbrev}</span>
            <span className="text-xs text-muted-foreground">{day}</span>
          </CardTitle>
          
          {!isEditing ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3 w-3" />
              <span className="sr-only">Edit {day}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Cancel</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-3">
        {!isEditing ? (
          <div className="space-y-1 min-h-[60px]">
            <div className="flex flex-wrap gap-1">
              {formatContentTypes(contentTypes)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-medium">Select content types:</div>
            
            <ToggleGroup 
              type="multiple" 
              value={selectedTypes}
              onValueChange={handleToggleType}
              className="flex flex-wrap gap-1"
            >
              {availableContentTypes.map(type => (
                <ToggleGroupItem 
                  key={type} 
                  value={type}
                  size="sm"
                  className="h-6 text-[10px]"
                  variant="outline"
                >
                  {type}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            
            <Button
              size="sm"
              className="w-full h-7 mt-2 text-xs"
              onClick={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-1">⏳</span> Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Save
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
