
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/pages/Settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

interface CreatorSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
  onSave: (updatedSettings: Partial<UserSettings>) => void;
}

export const CreatorSettings = ({ 
  settings, 
  setSettings, 
  loading,
  onSave 
}: CreatorSettingsProps) => {
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      onSave({
        niche: settings.niche,
        creator_style: settings.creator_style,
        content_format_preference: settings.content_format_preference,
        posting_frequency_goal: settings.posting_frequency_goal,
        existing_content: settings.existing_content,
      });
      
      toast({
        title: "Settings Saved",
        description: "Your creator profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="niche">Content Niche/Topic</Label>
          <Input
            id="niche"
            placeholder="e.g. Fitness, Tech, Finance, etc."
            value={settings.niche || ''}
            onChange={(e) => setSettings({...settings, niche: e.target.value})}
          />
          <p className="text-sm text-muted-foreground">What topics do you create content about?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator_style">Creator Style</Label>
          <Select
            value={settings.creator_style || ''}
            onValueChange={(value) => setSettings({...settings, creator_style: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your creator style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="entertaining">Entertaining</SelectItem>
              <SelectItem value="inspirational">Inspirational</SelectItem>
              <SelectItem value="informational">Informational</SelectItem>
              <SelectItem value="hybrid">Hybrid (Mix of styles)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">How would you describe your content style?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content_format">Preferred Content Format</Label>
          <Select
            value={settings.content_format_preference || ''}
            onValueChange={(value) => setSettings({...settings, content_format_preference: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select preferred content format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short_form">Short Form Videos</SelectItem>
              <SelectItem value="long_form">Long Form Videos</SelectItem>
              <SelectItem value="reels">Reels/TikToks</SelectItem>
              <SelectItem value="carousels">Image Carousels</SelectItem>
              <SelectItem value="mixed">Mixed (Multiple formats)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">What type of content do you prefer to create?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="posting_frequency">Target Posting Frequency</Label>
          <Select
            value={settings.posting_frequency_goal || ''}
            onValueChange={(value) => setSettings({...settings, posting_frequency_goal: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your posting goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (7 posts per week)</SelectItem>
              <SelectItem value="frequently">Frequently (3-5 posts per week)</SelectItem>
              <SelectItem value="occasionally">Occasionally (1-2 posts per week)</SelectItem>
              <SelectItem value="monthly">Monthly (Few posts per month)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">How often do you aim to post content?</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="existing_content">Existing Content</Label>
          <Select
            value={settings.existing_content || ''}
            onValueChange={(value) => setSettings({...settings, existing_content: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Do you have existing content?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes, I have existing content</SelectItem>
              <SelectItem value="no">No, I'm just starting out</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Have you already created content in this niche?</p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
