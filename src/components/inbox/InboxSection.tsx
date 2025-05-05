
import { InboxItem } from "@/types/inbox";
import { InboxItemCard } from "./InboxItemCard";
import { FileText, Lightbulb, Bell, MessageSquare, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InboxSectionProps {
  title: string;
  icon: React.ReactNode;
  items: InboxItem[];
  loading?: boolean;
  onAction: (item: InboxItem) => void;
}

export const InboxSection = ({ title, icon, items, loading = false, onAction }: InboxSectionProps) => {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-socialmize-purple">{icon}</div>
          <h3 className="font-medium text-lg">{title}</h3>
        </div>
        
        <div>
          {[1, 2].map((i) => (
            <div key={i} className="mb-3">
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-socialmize-purple">{icon}</div>
        <h3 className="font-medium text-lg">{title}</h3>
      </div>
      
      <div>
        {items.map((item) => (
          <InboxItemCard key={item.id} item={item} onAction={onAction} />
        ))}
      </div>
    </div>
  );
};

export const ScriptsSection = ({ items, loading, onAction }: Omit<InboxSectionProps, 'title' | 'icon'>) => (
  <InboxSection 
    title="Scripts & Content" 
    icon={<FileText size={20} />} 
    items={items} 
    loading={loading} 
    onAction={onAction} 
  />
);

export const IdeasSection = ({ items, loading, onAction }: Omit<InboxSectionProps, 'title' | 'icon'>) => (
  <InboxSection 
    title="Content Ideas" 
    icon={<Lightbulb size={20} />} 
    items={items} 
    loading={loading} 
    onAction={onAction} 
  />
);

export const RemindersSection = ({ items, loading, onAction }: Omit<InboxSectionProps, 'title' | 'icon'>) => (
  <InboxSection 
    title="Reminders" 
    icon={<Bell size={20} />} 
    items={items} 
    loading={loading} 
    onAction={onAction} 
  />
);

export const MessagesSection = ({ items, loading, onAction }: Omit<InboxSectionProps, 'title' | 'icon'>) => (
  <InboxSection 
    title="AI Messages" 
    icon={<MessageSquare size={20} />} 
    items={items} 
    loading={loading} 
    onAction={onAction} 
  />
);

export const NudgesSection = ({ items, loading, onAction }: Omit<InboxSectionProps, 'title' | 'icon'>) => (
  <InboxSection 
    title="Smart Nudges" 
    icon={<Zap size={20} />} 
    items={items} 
    loading={loading} 
    onAction={onAction} 
  />
);
