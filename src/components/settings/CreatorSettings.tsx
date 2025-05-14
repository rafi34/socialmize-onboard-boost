
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/pages/Settings";

interface CreatorSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

// Content frequency options
const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "multiple_weekly", label: "Multiple Times Per Week" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" }
];

// Creator style options
const styleOptions = [
  { value: "educational", label: "Educational" },
  { value: "entertaining", label: "Entertaining" },
  { value: "inspirational", label: "Inspirational" },
  { value: "informative", label: "Informative" },
  { value: "storytelling", label: "Storytelling" },
  { value: "tutorial", label: "Tutorial" }
];

// Content format options
const formatOptions = [
  { value: "talking_head", label: "Talking Head Video" },
  { value: "carousel", label: "Carousel Posts" },
  { value: "meme", label: "Memes" },
  { value: "duet", label: "Duets/Collaborations" },
  { value: "voiceover", label: "Voiceover Content" }
];

// Shooting mode options
const shootingOptions = [
  { value: "batch", label: "Batch Recording" },
  { value: "daily", label: "Daily Recording" },
  { value: "as_needed", label: "As Needed" }
];

const CreatorSettings = ({ settings, setSettings, loading }: CreatorSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  
  const [creatorSettings, setCreatorSettings] = useState({
    creatorMission: settings.creatorSettings.creatorMission || "",
    creatorStyle: settings.creatorSettings.creatorStyle || "",
    contentPreference: settings.creatorSettings.contentPreference || "",
    postingFrequency: settings.creatorSettings.postingFrequency || "",
    shootingMode: settings.creatorSettings.shootingMode || "",
    nicheTopic: settings.creatorSettings.nicheTopic || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setCreatorSettings({
      ...creatorSettings,
      [field]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      // Update onboarding answers
      const { error: onboardingError } = await supabase
        .from("onboarding_answers")
        .upsert({
          user_id: user.id,
          creator_mission: creatorSettings.creatorMission,
          creator_style: creatorSettings.creatorStyle,
          content_format_preference: creatorSettings.contentPreference,
          posting_frequency_goal: creatorSettings.postingFrequency,
          shooting_preference: creatorSettings.shootingMode,
          niche_topic: creatorSettings.nicheTopic
        });
      
      if (onboardingError) throw onboardingError;
      
      // Update strategy profile
      const { error: strategyError } = await supabase
        .from("strategy_profiles")
        .update({
          creator_style: creatorSettings.creatorStyle,
          posting_frequency: creatorSettings.postingFrequency,
          niche_topic: creatorSettings.nicheTopic,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);
      
      if (strategyError) throw strategyError;
      
      // Update local state
      setSettings({
        ...settings,
        creatorSettings: {
          ...creatorSettings
        }
      });
      
      toast({
        title: "Creator settings updated",
        description: "Your content strategy settings have been saved."
      });
      
      // Regenerate content strategy with new settings
      await supabase.functions.invoke('refresh-content-strategy', {
        body: { userId: user.id }
      });
      
    } catch (error: any) {
      console.error("Error updating creator settings:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Creator Strategy</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="creator-mission">Creator Mission</Label>
          <Textarea 
            id="creator-mission"
            placeholder="What's your goal as a content creator?"
            value={creatorSettings.creatorMission}
            onChange={(e) => handleInputChange("creatorMission", e.target.value)}
            disabled={loading || saving}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">Describe what you want to achieve with your content</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="niche-topic">Content Niche</Label>
          <Input 
            id="niche-topic"
            placeholder="Your primary content topic"
            value={creatorSettings.nicheTopic}
            onChange={(e) => handleInputChange("nicheTopic", e.target.value)}
            disabled={loading || saving}
          />
          <p className="text-xs text-muted-foreground">E.g., fitness, productivity, cooking, tech reviews</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="creator-style">Creator Style</Label>
            <Select
              value={creatorSettings.creatorStyle || undefined}
              onValueChange={(value) => handleInputChange("creatorStyle", value)}
              disabled={loading || saving}
            >
              <SelectTrigger id="creator-style">
                <SelectValue placeholder="Select your style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="posting-frequency">Posting Frequency</Label>
            <Select
              value={creatorSettings.postingFrequency || undefined}
              onValueChange={(value) => handleInputChange("postingFrequency", value)}
              disabled={loading || saving}
            >
              <SelectTrigger id="posting-frequency">
                <SelectValue placeholder="How often do you post?" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content-preference">Preferred Content Type</Label>
            <Select
              value={creatorSettings.contentPreference || undefined}
              onValueChange={(value) => handleInputChange("contentPreference", value)}
              disabled={loading || saving}
            >
              <SelectTrigger id="content-preference">
                <SelectValue placeholder="Select content format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shooting-mode">Preferred Shooting Style</Label>
            <Select
              value={creatorSettings.shootingMode || undefined}
              onValueChange={(value) => handleInputChange("shootingMode", value)}
              disabled={loading || saving}
            >
              <SelectTrigger id="shooting-mode">
                <SelectValue placeholder="How do you record?" />
              </SelectTrigger>
              <SelectContent>
                {shootingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="pt-4">
          <Button type="submit" disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatorSettings;
