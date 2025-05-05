
import { Button } from "@/components/ui/button";
import { InboxFilter } from "@/types/inbox";

interface InboxFiltersProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  unreadCount: number;
}

export const InboxFilters = ({ activeFilter, onFilterChange, unreadCount }: InboxFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("all")}
      >
        All
      </Button>
      
      <Button
        variant={activeFilter === "unread" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("unread")}
        className="relative"
      >
        Unread
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      
      <Button
        variant={activeFilter === "week" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("week")}
      >
        This Week
      </Button>
      
      <Button
        variant={activeFilter === "action" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("action")}
      >
        Needs Action
      </Button>
    </div>
  );
};
