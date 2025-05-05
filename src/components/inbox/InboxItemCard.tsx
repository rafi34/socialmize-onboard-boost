
import { useState } from "react";
import { format, isPast, isToday, isTomorrow, isThisWeek } from "date-fns";
import { InboxItem } from "@/types/inbox";
import { InboxTypeIcon } from "./InboxTypeIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, ArrowRight, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ReminderConfetti } from "@/components/dashboard/ReminderConfetti";

interface InboxItemCardProps {
  item: InboxItem;
  onAction: (item: InboxItem) => void;
}

export const InboxItemCard = ({ item, onAction }: InboxItemCardProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const getBorderColor = () => {
    switch (item.item_type) {
      case 'script': return 'border-purple-200';
      case 'idea': return 'border-amber-200';
      case 'reminder': return 'border-orange-200';
      case 'ai_message': return 'border-blue-200';
      case 'nudge': return 'border-green-200';
      default: return 'border-gray-200';
    }
  };
  
  const getBackgroundColor = () => {
    if (!item.is_read) return 'bg-gray-50';
    return 'bg-white';
  };
  
  const getPriorityBadge = () => {
    if (!item.priority) return null;
    
    const colorMap = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${colorMap[item.priority]} capitalize`}>
        {item.priority}
      </Badge>
    );
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };
  
  const getDueInfo = () => {
    if (!item.due_at) return null;
    
    const dueDate = new Date(item.due_at);
    const isPastDue = isPast(dueDate) && !item.is_completed;
    
    return (
      <div className={`text-xs ${isPastDue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
        {isPastDue ? 'Past due: ' : 'Due: '}
        {formatDate(item.due_at)}
      </div>
    );
  };
  
  const handleMarkAsRead = async () => {
    if (item.is_read) return;
    
    try {
      const { error } = await supabase
        .from('inbox_items')
        .update({ is_read: true })
        .eq('id', item.id);
        
      if (error) throw error;
      
      // Update the local state
      item.is_read = true;
    } catch (error) {
      console.error('Error marking item as read:', error);
    }
  };
  
  const handleAction = async () => {
    setProcessing(true);
    
    try {
      if (!item.is_read) {
        await handleMarkAsRead();
      }
      
      if (item.item_type === 'reminder' || item.item_type === 'nudge') {
        const { error } = await supabase
          .from('inbox_items')
          .update({ is_completed: true })
          .eq('id', item.id);
          
        if (error) throw error;
        
        // Update the local state
        item.is_completed = true;
        
        // Show confetti for completed items with XP
        if (item.xp_reward && item.xp_reward > 0) {
          setShowConfetti(true);
          
          toast({
            title: "Great job!",
            description: `You earned ${item.xp_reward} XP for completing this task.`,
          });
          
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
      
      // Call the parent's action handler
      onAction(item);
    } catch (error) {
      console.error('Error handling action:', error);
      toast({
        title: "Action failed",
        description: "There was a problem processing your action.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <>
      <Card 
        className={`mb-3 transition-all ${getBorderColor()} ${getBackgroundColor()} hover:shadow-md`}
        onClick={handleMarkAsRead}
      >
        <CardHeader className="py-3 px-4 flex flex-row items-start justify-between gap-2">
          <div className="flex items-center space-x-2">
            <InboxTypeIcon itemType={item.item_type} />
            <div>
              <h4 className="text-sm font-medium">{item.title}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatDate(item.created_at)}
                </span>
                {!item.is_read && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] h-4 px-1">
                    New
                  </Badge>
                )}
                {item.is_completed && (
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 text-[10px] h-4 px-1">
                    Completed
                  </Badge>
                )}
                {getPriorityBadge()}
              </div>
            </div>
          </div>
          {item.streak_effect && (
            <div className="shrink-0">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </CardHeader>
        
        <CardContent className="py-1 px-4">
          <p className="text-sm text-gray-700">{item.description}</p>
          {getDueInfo()}
        </CardContent>
        
        <CardFooter className="py-2 px-4 flex justify-between">
          <div className="flex items-center gap-1">
            {item.xp_reward && item.xp_reward > 0 && (
              <Badge className="bg-teal-100 text-teal-800 text-xs border-none">
                +{item.xp_reward} XP
              </Badge>
            )}
          </div>
          
          {!item.is_completed && item.action_text && (
            <Button 
              size="sm" 
              className="text-xs h-8"
              onClick={handleAction}
              disabled={processing}
              variant={item.item_type === 'nudge' ? "outline" : "default"}
            >
              {item.item_type === 'reminder' ? (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              ) : item.item_type === 'nudge' ? (
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
              ) : item.item_type === 'ai_message' ? (
                <ArrowRight className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Calendar className="h-3.5 w-3.5 mr-1" />
              )}
              {item.action_text}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <ReminderConfetti active={showConfetti} />
    </>
  );
};
