
import { Button } from "@/components/ui/button";
import { BadgeFilter } from "@/types/inbox";

interface BadgeFiltersProps {
  activeFilter: BadgeFilter;
  onFilterChange: (filter: BadgeFilter) => void;
  counts: {
    unlocked: number;
    locked: number;
    upcoming: number;
    total: number;
  };
}

export const BadgeFilters = ({ activeFilter, onFilterChange, counts }: BadgeFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("all")}
      >
        All ({counts.total})
      </Button>
      
      <Button
        variant={activeFilter === "unlocked" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("unlocked")}
      >
        Unlocked ({counts.unlocked})
      </Button>
      
      <Button
        variant={activeFilter === "locked" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("locked")}
      >
        Locked ({counts.locked})
      </Button>
      
      <Button
        variant={activeFilter === "upcoming" ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange("upcoming")}
      >
        Upcoming ({counts.upcoming})
      </Button>
    </div>
  );
};
