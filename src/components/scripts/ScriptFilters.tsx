
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ScriptFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  showFavoritesFilter?: boolean;
}

export const ScriptFilters = ({ onFilterChange, showFavoritesFilter = false }: ScriptFiltersProps) => {
  const [contentType, setContentType] = useState<string>('all');
  const [length, setLength] = useState<string>('all');
  const [favorites, setFavorites] = useState<string>('all');

  const handleContentTypeChange = (value: string) => {
    setContentType(value);
    onFilterChange({ contentType: value, length, favorites });
  };

  const handleLengthChange = (value: string) => {
    setLength(value);
    onFilterChange({ contentType, length: value, favorites });
  };

  const handleFavoritesChange = (value: string) => {
    setFavorites(value);
    onFilterChange({ contentType, length, favorites: value });
  };

  const clearFilters = () => {
    setContentType('all');
    setLength('all');
    if (showFavoritesFilter) {
      setFavorites('all');
    }
    onFilterChange({ contentType: 'all', length: 'all', favorites: 'all' });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-auto">
            <label className="text-sm font-medium block mb-1.5">Content Type</label>
            <Select value={contentType} onValueChange={handleContentTypeChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Talking Head">Talking Head</SelectItem>
                <SelectItem value="Carousel">Carousel</SelectItem>
                <SelectItem value="Duet">Duet</SelectItem>
                <SelectItem value="Meme">Meme</SelectItem>
                <SelectItem value="Voiceover">Voiceover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="text-sm font-medium block mb-1.5">Script Length</label>
            <Select value={length} onValueChange={handleLengthChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Any Length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Length</SelectItem>
                <SelectItem value="short">Short (&lt; 300 chars)</SelectItem>
                <SelectItem value="medium">Medium (300-600 chars)</SelectItem>
                <SelectItem value="long">Long (&gt; 600 chars)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {showFavoritesFilter && (
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium block mb-1.5">Favorites</label>
              <Select value={favorites} onValueChange={handleFavoritesChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Show All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show All</SelectItem>
                  <SelectItem value="favorites">Favorites Only</SelectItem>
                  <SelectItem value="non-favorites">Non-Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="ml-auto self-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-sm"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
