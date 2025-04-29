
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { UserSettings } from "@/pages/Settings";

interface CreatorSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const CreatorSettings = ({ settings, setSettings, loading }: CreatorSettingsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const onboardingData = settings.creatorSettings;
  
  // Function to restart onboarding
  const handleRestartOnboarding = () => {
    toast({
      title: "Restarting onboarding",
      description: "You'll be redirected to update your creator profile."
    });
    navigate("/");
  };

  // Function to regenerate content strategy
  const handleRegenerateStrategy = () => {
    toast({
      title: "Strategy Refresh",
      description: "Your content strategy will be regenerated based on your preferences."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium">Onboarding Summary</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="creator-mission">Creator Mission</Label>
          <Input 
            id="creator-mission" 
            value={onboardingData.creatorMission || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="creator-style">Creator Style</Label>
          <Input 
            id="creator-style" 
            value={onboardingData.creatorStyle || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content-preference">Content Format Preference</Label>
          <Input 
            id="content-preference" 
            value={onboardingData.contentPreference || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="posting-frequency">Posting Frequency</Label>
          <Input 
            id="posting-frequency" 
            value={onboardingData.postingFrequency || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="shooting-mode">Shooting Mode</Label>
          <Input 
            id="shooting-mode" 
            value={onboardingData.shootingMode || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="existing-content">Existing Content</Label>
          <Input 
            id="existing-content" 
            value={onboardingData.existingContent === true ? "Yes" : 
                  onboardingData.existingContent === false ? "No" : "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="niche-topic">Niche/Topic Focus</Label>
          <Input 
            id="niche-topic" 
            value={onboardingData.nicheTopic || "Not set"}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button onClick={handleRestartOnboarding} disabled={loading}>
          Update My Preferences
        </Button>
        <Button onClick={handleRegenerateStrategy} variant="outline" disabled={loading}>
          Regenerate Strategy
        </Button>
      </div>
    </div>
  );
};

export default CreatorSettings;
