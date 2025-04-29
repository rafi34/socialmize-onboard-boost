
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/pages/Settings";

interface NotificationSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const NotificationSettings = ({ settings, setSettings, loading }: NotificationSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState({
    emailReminders: settings.notifications.emailReminders,
    pushNotifications: settings.notifications.pushNotifications,
    weeklySummary: settings.notifications.weeklySummary,
    creatorReports: settings.notifications.creatorReports
  });

  const updateNotificationSetting = (key: keyof typeof notifications) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      // Here we would update notification preferences in the database
      // For this example, we'll just update the local state and show a toast
      
      setSettings({
        ...settings,
        notifications: notifications
      });
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved."
      });
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
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
      <h3 className="text-xl font-medium">Notification Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-reminders" className="flex-grow">Email reminders</Label>
            <Switch 
              id="email-reminders"
              checked={notifications.emailReminders}
              onCheckedChange={() => updateNotificationSetting("emailReminders")}
              disabled={loading || saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications" className="flex-grow">Push notifications</Label>
              <p className="text-xs text-muted-foreground">Requires browser permission</p>
            </div>
            <Switch 
              id="push-notifications"
              checked={notifications.pushNotifications}
              onCheckedChange={() => updateNotificationSetting("pushNotifications")}
              disabled={loading || saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-summary" className="flex-grow">Weekly summary emails</Label>
            <Switch 
              id="weekly-summary"
              checked={notifications.weeklySummary}
              onCheckedChange={() => updateNotificationSetting("weeklySummary")}
              disabled={loading || saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="creator-reports" className="flex-grow">Creator report emails</Label>
            <Switch 
              id="creator-reports"
              checked={notifications.creatorReports}
              onCheckedChange={() => updateNotificationSetting("creatorReports")}
              disabled={loading || saving}
            />
          </div>
        </div>
        
        <div>
          <Button type="submit" disabled={loading || saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
