
import { 
  FileText, 
  Lightbulb, 
  Bell, 
  MessageSquare, 
  Zap, 
  CalendarCheck 
} from "lucide-react";
import { InboxItem } from "@/types/inbox";

interface InboxTypeIconProps {
  itemType: InboxItem['item_type'];
  size?: number;
  className?: string;
}

export const InboxTypeIcon = ({ itemType, size = 18, className = "" }: InboxTypeIconProps) => {
  const getIcon = () => {
    switch (itemType) {
      case 'script':
        return <FileText size={size} className={`text-purple-500 ${className}`} />;
      case 'idea':
        return <Lightbulb size={size} className={`text-amber-500 ${className}`} />;
      case 'reminder':
        return <Bell size={size} className={`text-orange-500 ${className}`} />;
      case 'ai_message':
        return <MessageSquare size={size} className={`text-blue-500 ${className}`} />;
      case 'nudge':
        return <Zap size={size} className={`text-green-500 ${className}`} />;
      default:
        return <CalendarCheck size={size} className={`text-gray-500 ${className}`} />;
    }
  };

  return getIcon();
};
