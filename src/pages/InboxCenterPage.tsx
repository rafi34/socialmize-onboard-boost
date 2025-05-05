
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InboxItem, InboxFilter } from "@/types/inbox";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { 
  ScriptsSection, 
  IdeasSection, 
  RemindersSection, 
  MessagesSection, 
  NudgesSection 
} from "@/components/inbox/InboxSection";
import { Loader2, RefreshCw } from "lucide-react";
import { startOfWeek } from "date-fns";

const InboxCenterPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Fetch inbox items
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inbox-items', user?.id, refreshTrigger, activeFilter],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      let query = supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (activeFilter === "unread") {
        query = query.eq('is_read', false);
      } else if (activeFilter === "week") {
        const weekStart = startOfWeek(new Date()).toISOString();
        query = query.gte('created_at', weekStart);
      } else if (activeFilter === "action") {
        query = query.eq('is_completed', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as InboxItem[];
    },
    enabled: !!user,
  });
  
  // Fetch and generate nudges
  const { isLoading: isGeneratingNudges, refetch: regenerateNudges } = useQuery({
    queryKey: ['generate-nudges', user?.id, refreshTrigger],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const response = await supabase.functions.invoke('generate-inbox-nudges', {
        body: { userId: user.id }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to generate nudges");
      }
      
      return response.data;
    },
    enabled: !!user,
  });
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
    regenerateNudges();
  };
  
  const handleItemAction = (item: InboxItem) => {
    // Navigate to the appropriate page based on item type
    if (item.item_type === 'script' && item.source_id) {
      navigate(`/script-preview/${item.source_id}`);
    } else if (item.item_type === 'idea' && item.source_id) {
      navigate(`/generate-scripts?ideaId=${item.source_id}`);
    } else if (item.item_type === 'reminder') {
      // For reminders, we might just mark them as completed in the component
      refetch();
    } else if (item.item_type === 'ai_message' && item.metadata?.thread_id) {
      navigate(`/strategy-chat?threadId=${item.metadata.thread_id}`);
    } else if (item.item_type === 'nudge' && item.action_link) {
      navigate(item.action_link);
    }
  };
  
  // Group items by type
  const scriptItems = data?.filter(item => item.item_type === 'script') || [];
  const ideaItems = data?.filter(item => item.item_type === 'idea') || [];
  const reminderItems = data?.filter(item => item.item_type === 'reminder') || [];
  const messageItems = data?.filter(item => item.item_type === 'ai_message') || [];
  const nudgeItems = data?.filter(item => item.item_type === 'nudge') || [];
  
  // Calculate unread count
  const unreadCount = data?.filter(item => !item.is_read).length || 0;
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <PageHeader
          title="Your Creator Inbox"
          description="Review what's fresh, what's next, and what needs your attention."
        />
        
        <Button 
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading || isGeneratingNudges}
        >
          {(isLoading || isGeneratingNudges) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      <InboxFilters 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
        unreadCount={unreadCount} 
      />
      
      {isLoading ? (
        <div className="space-y-8">
          <NudgesSection loading={true} items={[]} onAction={handleItemAction} />
          <RemindersSection loading={true} items={[]} onAction={handleItemAction} />
          <ScriptsSection loading={true} items={[]} onAction={handleItemAction} />
        </div>
      ) : data && data.length > 0 ? (
        <div>
          {/* Always show nudges at the top when they exist */}
          <NudgesSection items={nudgeItems} onAction={handleItemAction} />
          
          {/* Show reminders next as they're often time-sensitive */}
          <RemindersSection items={reminderItems} onAction={handleItemAction} />
          
          {/* Then scripts and content */}
          <ScriptsSection items={scriptItems} onAction={handleItemAction} />
          
          {/* Then ideas */}
          <IdeasSection items={ideaItems} onAction={handleItemAction} />
          
          {/* Finally AI messages */}
          <MessagesSection items={messageItems} onAction={handleItemAction} />
        </div>
      ) : (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Your inbox is empty</h3>
          <p className="text-muted-foreground mb-4">
            No items to display. Try changing filters or creating new content.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/generate-scripts')}>
              Generate Scripts
            </Button>
            <Button variant="outline" onClick={() => navigate('/strategy-chat')}>
              Chat with AI
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InboxCenterPage;
