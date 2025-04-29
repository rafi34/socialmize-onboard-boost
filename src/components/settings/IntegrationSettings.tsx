
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { UserSettings } from "@/pages/Settings";

interface IntegrationSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const IntegrationSettings = ({ settings, setSettings, loading }: IntegrationSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState({
    googleConnected: settings.integrations.googleConnected,
    calendarSync: settings.integrations.calendarSync
  });

  const handleGoogleConnect = () => {
    // Future implementation would use OAuth to connect Google
    toast({
      title: "Coming Soon",
      description: "Google account connection will be available soon!"
    });
  };

  const handleGoogleDisconnect = () => {
    // Future implementation would disconnect Google account
    toast({
      title: "Coming Soon",
      description: "Google account disconnection will be available soon!"
    });
  };

  const toggleCalendarSync = () => {
    setIntegrations({
      ...integrations,
      calendarSync: !integrations.calendarSync
    });
  };

  const handleSaveIntegrations = async () => {
    setSaving(true);
    try {
      // Future implementation would save integration settings to database
      
      setSettings({
        ...settings,
        integrations: {
          ...settings.integrations,
          calendarSync: integrations.calendarSync
        }
      });
      
      toast({
        title: "Integration settings saved",
        description: "Your integration preferences have been updated."
      });
    } catch (error: any) {
      console.error("Error saving integration settings:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Connected Accounts</h3>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Google Account</Label>
            
            <div className="flex items-center gap-2 py-2">
              <div className="flex-grow">
                {settings.integrations.googleConnected ? (
                  <p>{settings.integrations.googleEmail || "Account connected"}</p>
                ) : (
                  <p className="text-muted-foreground">Not connected</p>
                )}
              </div>
              
              {settings.integrations.googleConnected ? (
                <Button variant="outline" onClick={handleGoogleDisconnect} disabled={loading || saving}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={handleGoogleConnect} disabled={loading || saving}>
                  Connect Google Account
                </Button>
              )}
            </div>
          </div>
          
          {settings.integrations.googleConnected && (
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="calendar-sync">Sync with Google Calendar</Label>
                <p className="text-xs text-muted-foreground">Add your content schedule to Google Calendar</p>
              </div>
              <Switch 
                id="calendar-sync"
                checked={integrations.calendarSync}
                onCheckedChange={toggleCalendarSync}
                disabled={loading || saving || !settings.integrations.googleConnected}
              />
            </div>
          )}
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium mb-4">Future Integrations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
              <p className="text-center text-muted-foreground">Instagram</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
              <p className="text-center text-muted-foreground">TikTok</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/30 flex items-center justify-center">
              <p className="text-center text-muted-foreground">YouTube</p>
            </div>
          </div>
        </div>
        
        <div>
          <Button onClick={handleSaveIntegrations} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;
