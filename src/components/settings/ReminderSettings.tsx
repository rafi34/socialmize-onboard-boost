
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { UserSettings } from "@/pages/Settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TimeInput } from "@/components/ui/time-input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ReminderSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

interface ReminderPreferences {
  googleCalendarSync: boolean;
  preferredRecordingDays: string[];
  preferredReminderTime: string;
}

const ReminderSettings = ({ settings, setSettings, loading }: ReminderSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    googleCalendarSync: settings.integrations.googleConnected && settings.integrations.calendarSync,
    preferredRecordingDays: ['Monday', 'Thursday'],
    preferredReminderTime: '10:00'
  });

  // Fetch user's current reminder preferences
  useEffect(() => {
    const fetchReminderPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('google_calendar_sync, preferred_recording_days, preferred_reminder_time')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setPreferences({
            googleCalendarSync: data.google_calendar_sync || false,
            preferredRecordingDays: data.preferred_recording_days || ['Monday', 'Thursday'],
            preferredReminderTime: data.preferred_reminder_time ? data.preferred_reminder_time.substring(0, 5) : '10:00'
          });
        }
      } catch (error) {
        console.error("Error fetching reminder preferences:", error);
      }
    };
    
    fetchReminderPreferences();
  }, [user]);

  const toggleGoogleCalendarSync = () => {
    setPreferences({
      ...preferences,
      googleCalendarSync: !preferences.googleCalendarSync
    });
  };

  const toggleRecordingDay = (day: string) => {
    setPreferences(prev => {
      if (prev.preferredRecordingDays.includes(day)) {
        return {
          ...prev,
          preferredRecordingDays: prev.preferredRecordingDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          preferredRecordingDays: [...prev.preferredRecordingDays, day]
        };
      }
    });
  };

  const handleTimeChange = (time: string) => {
    setPreferences({
      ...preferences,
      preferredReminderTime: time
    });
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          google_calendar_sync: preferences.googleCalendarSync,
          preferred_recording_days: preferences.preferredRecordingDays,
          preferred_reminder_time: preferences.preferredReminderTime + ':00' // Add seconds
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update settings context for Google Calendar sync
      setSettings({
        ...settings,
        integrations: {
          ...settings.integrations,
          calendarSync: preferences.googleCalendarSync
        }
      });
      
      // Regenerate reminders to apply new preferences
      if (user) {
        await supabase.functions.invoke('generate-reminders', {
          body: { userId: user.id }
        });
      }
      
      toast({
        title: "Reminder settings saved",
        description: "Your reminder preferences have been updated."
      });
    } catch (error: any) {
      console.error("Error saving reminder settings:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Reminder Preferences</h3>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Reminder Time</Label>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={preferences.preferredReminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">When should we remind you about posting and recording?</p>
          </div>
          
          <div className="space-y-2">
            <Label>Preferred Recording Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {daysOfWeek.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day}`}
                    checked={preferences.preferredRecordingDays.includes(day)}
                    onCheckedChange={() => toggleRecordingDay(day)}
                  />
                  <Label htmlFor={`day-${day}`} className="cursor-pointer">{day}</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Which days do you prefer to record content in bulk?</p>
          </div>
          
          {settings.integrations.googleConnected && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label htmlFor="google-calendar-sync">Google Calendar Sync</Label>
                <p className="text-xs text-muted-foreground">Automatically add reminders to your Google Calendar</p>
              </div>
              <Switch 
                id="google-calendar-sync"
                checked={preferences.googleCalendarSync}
                onCheckedChange={toggleGoogleCalendarSync}
                disabled={loading || saving || !settings.integrations.googleConnected}
              />
            </div>
          )}
        </div>
        
        <div>
          <Button onClick={handleSavePreferences} disabled={loading || saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
