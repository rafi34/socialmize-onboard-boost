
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw, Filter } from "lucide-react";

interface MissionFiltersProps {
  onFilterChange: (format: string) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const MissionFilters = ({ 
  onFilterChange,
  onRefresh,
  isRefreshing 
}: MissionFiltersProps) => {
  const [activeFormat, setActiveFormat] = useState<string>("all");
  
  const handleFormatChange = (value: string) => {
    setActiveFormat(value);
    onFilterChange(value);
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-card border rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Filter className="text-muted-foreground h-4 w-4" />
        <span className="text-sm font-medium">Filter:</span>
        
        <Tabs defaultValue="all" className="w-full" onValueChange={handleFormatChange}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="Video" className="text-xs">Video</TabsTrigger>
            <TabsTrigger value="Carousel" className="text-xs">Carousel</TabsTrigger>
            <TabsTrigger value="Talking Head" className="text-xs">Talking Head</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-xs whitespace-nowrap"
      >
        {isRefreshing ? (
          <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <RefreshCcw className="h-3 w-3 mr-1" />
        )}
        Refresh Ideas
      </Button>
    </div>
  );
};
