import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserSettings } from "@/pages/Settings";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreatorMission, CreatorStyle, ContentFormat, PostingFrequency, ShootingPreference } from "@/types/onboarding";

interface CreatorSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const CreatorSettings = ({ settings, setSettings, loading }: CreatorSettingsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [updatedSettings, setUpdatedSettings] = useState({...settings.creatorSettings});
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mission options
  const missionOptions: { value: CreatorMission | null; label: string }[] = [
    { value: "gain_followers", label: "Gain followers" },
    { value: "get_leads", label: "Get leads" },
    { value: "grow_personal_brand", label: "Grow personal brand" },
    { value: "go_viral", label: "Go viral" },
    { value: "build_community", label: "Build community" },
  ];

  // Style options
  const styleOptions: { value: CreatorStyle | null; label: string }[] = [
    { value: "bold_energetic", label: "Bold and energetic" },
    { value: "calm_motivational", label: "Calm and motivational" },
    { value: "funny_relatable", label: "Funny and relatable" },
    { value: "inspirational_wise", label: "Inspirational and wise" },
    { value: "raw_authentic", label: "Raw and authentic" },
  ];

  // Content format options
  const formatOptions: { value: ContentFormat | null; label: string }[] = [
    { value: "talking_to_camera", label: "Talking to camera" },
    { value: "voiceovers", label: "Voiceovers" },
    { value: "skits_storytelling", label: "Skits and storytelling" },
    { value: "tutorials_howto", label: "Tutorials and how-to" },
    { value: "lifestyle_documentary", label: "Lifestyle documentary" },
  ];

  // Posting frequency options
  const frequencyOptions: { value: PostingFrequency | null; label: string }[] = [
    { value: "multiple_daily", label: "Multiple posts per day" },
    { value: "daily", label: "Daily" },
    { value: "three_to_five_weekly", label: "3-5 times per week" },
    { value: "one_to_two_weekly", label: "1-2 times per week" },
    { value: "warming_up", label: "Just warming up" },
  ];

  // Shooting mode options
  const shootingOptions: { value: ShootingPreference | null; label: string }[] = [
    { value: "bulk_shooting", label: "Bulk shooting" },
    { value: "single_video", label: "Single video" },
  ];

  // Function to restart onboarding
  const handleRestartOnboarding = () => {
    toast({
      title: "Restarting onboarding",
      description: "You'll be redirected to update your creator profile."
    });
    navigate("/");
  };

  // Function to regenerate content strategy
  const handleRegenerateStrategy = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // First sync the settings
      await syncCreatorSettings();
      
      // Then notify the user about strategy regeneration
      toast({
        title: "Strategy Refresh",
        description: "Your content strategy will be regenerated based on your preferences."
      });
    } catch (error) {
      console.error("Error regenerating strategy:", error);
      toast({
        title: "Refresh Failed",
        description: "There was a problem refreshing your strategy. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to sync creator settings with strategy profile
  const syncCreatorSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-creator-settings', {
        body: { userId: user.id }
      });
      
      if (error) throw error;
      
      console.log("Settings synced:", data);
      return data;
    } catch (error) {
      console.error("Error syncing settings:", error);
      throw error;
    }
  };

  // Function to toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setUpdatedSettings({...settings.creatorSettings});
    }
  };

  // Function to update a specific field
  const updateField = <K extends keyof typeof updatedSettings>(key: K, value: any) => {
    setUpdatedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Function to save changes
  const saveChanges = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Convert boolean to string for existing_content
      const existingContent = updatedSettings.existingContent !== null 
        ? String(updatedSettings.existingContent) 
        : null;

      const { error } = await supabase
        .from('onboarding_answers')
        .update({
          creator_mission: updatedSettings.creatorMission,
          creator_style: updatedSettings.creatorStyle,
          content_format_preference: updatedSettings.contentPreference,
          posting_frequency_goal: updatedSettings.postingFrequency,
          shooting_preference: updatedSettings.shootingMode,
          existing_content: existingContent,
          niche_topic: updatedSettings.nicheTopic,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setSettings(prev => ({
        ...prev,
        creatorSettings: updatedSettings
      }));
      
      // Sync the settings with the strategy profile
      await syncCreatorSettings();
      
      // Exit edit mode
      setIsEditing(false);
      
      toast({
        title: "Settings Updated",
        description: "Your creator preferences have been saved and synced successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Update Failed",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Onboarding Summary</h3>
        <Button 
          variant="outline" 
          onClick={toggleEditMode}
          disabled={loading || isSaving}
        >
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Creator Mission */}
        <div className="space-y-2">
          <Label htmlFor="creator-mission">Creator Mission</Label>
          {isEditing ? (
            <Select 
              disabled={isSaving}
              value={updatedSettings.creatorMission || undefined} 
              onValueChange={(value) => updateField("creatorMission", value)}
            >
              <SelectTrigger id="creator-mission">
                <SelectValue placeholder="Select your creator mission" />
              </SelectTrigger>
              <SelectContent>
                {missionOptions.map(option => (
                  <SelectItem key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              id="creator-mission" 
              value={updatedSettings.creatorMission || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Creator Style */}
        <div className="space-y-2">
          <Label htmlFor="creator-style">Creator Style</Label>
          {isEditing ? (
            <Select 
              disabled={isSaving}
              value={updatedSettings.creatorStyle || undefined} 
              onValueChange={(value) => updateField("creatorStyle", value)}
            >
              <SelectTrigger id="creator-style">
                <SelectValue placeholder="Select your creator style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map(option => (
                  <SelectItem key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              id="creator-style" 
              value={updatedSettings.creatorStyle || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Content Format Preference */}
        <div className="space-y-2">
          <Label htmlFor="content-preference">Content Format Preference</Label>
          {isEditing ? (
            <Select 
              disabled={isSaving}
              value={updatedSettings.contentPreference || undefined} 
              onValueChange={(value) => updateField("contentPreference", value)}
            >
              <SelectTrigger id="content-preference">
                <SelectValue placeholder="Select your content format" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map(option => (
                  <SelectItem key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              id="content-preference" 
              value={updatedSettings.contentPreference || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Posting Frequency */}
        <div className="space-y-2">
          <Label htmlFor="posting-frequency">Posting Frequency</Label>
          {isEditing ? (
            <Select 
              disabled={isSaving}
              value={updatedSettings.postingFrequency || undefined} 
              onValueChange={(value) => updateField("postingFrequency", value)}
            >
              <SelectTrigger id="posting-frequency">
                <SelectValue placeholder="Select your posting frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              id="posting-frequency" 
              value={updatedSettings.postingFrequency || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Shooting Mode */}
        <div className="space-y-2">
          <Label htmlFor="shooting-mode">Shooting Mode</Label>
          {isEditing ? (
            <Select 
              disabled={isSaving}
              value={updatedSettings.shootingMode || undefined} 
              onValueChange={(value) => updateField("shootingMode", value)}
            >
              <SelectTrigger id="shooting-mode">
                <SelectValue placeholder="Select your shooting mode" />
              </SelectTrigger>
              <SelectContent>
                {shootingOptions.map(option => (
                  <SelectItem key={option.value || 'none'} value={option.value || ''}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input 
              id="shooting-mode" 
              value={updatedSettings.shootingMode || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Existing Content */}
        <div className="space-y-2">
          <Label htmlFor="existing-content">Existing Content</Label>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Switch 
                id="existing-content"
                checked={updatedSettings.existingContent === true}
                onCheckedChange={(checked) => updateField("existingContent", checked)}
                disabled={isSaving}
              />
              <span>
                {updatedSettings.existingContent === true ? "Yes" : 
                 updatedSettings.existingContent === false ? "No" : "Not set"}
              </span>
            </div>
          ) : (
            <Input 
              id="existing-content" 
              value={updatedSettings.existingContent === true ? "Yes" : 
                    updatedSettings.existingContent === false ? "No" : "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
        
        {/* Niche/Topic */}
        <div className="space-y-2">
          <Label htmlFor="niche-topic">Niche/Topic Focus</Label>
          {isEditing ? (
            <Input 
              id="niche-topic" 
              value={updatedSettings.nicheTopic || ""} 
              onChange={(e) => updateField("nicheTopic", e.target.value)}
              placeholder="Enter your niche or topic"
              disabled={isSaving}
            />
          ) : (
            <Input 
              id="niche-topic" 
              value={updatedSettings.nicheTopic || "Not set"}
              readOnly
              className="bg-muted"
            />
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button 
            onClick={saveChanges} 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button 
            onClick={toggleEditMode} 
            variant="outline" 
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button onClick={handleRestartOnboarding} disabled={loading}>
            Update My Preferences
          </Button>
          <Button onClick={handleRegenerateStrategy} variant="outline" disabled={loading || isSyncing}>
            {isSyncing ? "Syncing..." : "Regenerate Strategy"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreatorSettings;
