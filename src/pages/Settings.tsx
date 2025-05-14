
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { CreatorSettings } from "@/components/settings/CreatorSettings";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { ExpandedProfileSettings } from "@/components/settings/ExpandedProfileSettings";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Define type for user settings
export interface UserSettings {
  id?: string;
  email?: string;
  level?: number;
  xp?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  tiktokHandle?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  niche?: string;
  creator_style?: string;
  content_format_preference?: string;
  posting_frequency_goal?: string;
  experience_level?: string;
  google_calendar_sync?: boolean;
  preferred_recording_days?: string[];
  preferred_reminder_time?: string;
  reminder_enabled?: boolean;
  notificationEmail?: boolean;
  notificationPush?: boolean;
  existing_content?: string;
}

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(false);
  
  // Fetch user settings on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Get onboarding data
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_answers')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        // Combine the data
        const combinedSettings: UserSettings = {
          ...profileData,
          ...onboardingData
        };
        
        setSettings(combinedSettings);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // Handle settings save
  const handleSaveSettings = async (updatedSettings: Partial<UserSettings>, settingType: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Split data between tables based on settingType
      if (settingType === 'profile' || settingType === 'account') {
        // Update profile data
        const { error } = await supabase
          .from('profiles')
          .update({
            firstName: updatedSettings.firstName,
            lastName: updatedSettings.lastName,
            username: updatedSettings.username,
            bio: updatedSettings.bio,
            avatar: updatedSettings.avatar,
            website: updatedSettings.website,
          })
          .eq('id', user.id);
          
        if (error) throw error;
      }
      
      if (settingType === 'creator') {
        // Update onboarding answers
        const { error } = await supabase
          .from('onboarding_answers')
          .update({
            niche_topic: updatedSettings.niche,
            creator_style: updatedSettings.creator_style,
            content_format_preference: updatedSettings.content_format_preference,
            posting_frequency_goal: updatedSettings.posting_frequency_goal,
            existing_content: updatedSettings.existing_content,
          })
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      // Update settings state
      setSettings(prev => ({ ...prev, ...updatedSettings }));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {/* Sidebar */}
        <Card className="p-4 h-fit">
          <div className="space-y-1">
            <Button 
              variant={activeTab === "profile" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </Button>
            <Button 
              variant={activeTab === "creator" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("creator")}
            >
              Creator Profile
            </Button>
            <Button 
              variant={activeTab === "reminders" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("reminders")}
            >
              Reminders
            </Button>
            <Button 
              variant={activeTab === "notifications" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </Button>
            <Button 
              variant={activeTab === "integrations" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("integrations")}
            >
              Integrations
            </Button>
            <Button 
              variant={activeTab === "billing" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("billing")}
            >
              Billing
            </Button>
            <Button 
              variant={activeTab === "security" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("security")}
            >
              Security
            </Button>
          </div>
        </Card>
        
        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === "profile" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>
              <ProfileSettings
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'profile')}
              />
              
              <Separator className="my-6" />
              
              <h2 className="text-xl font-semibold mb-6">Expanded Profile</h2>
              <ExpandedProfileSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'expanded')}
              />
            </Card>
          )}
          
          {activeTab === "creator" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Creator Settings</h2>
              <CreatorSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'creator')}
              />
            </Card>
          )}
          
          {activeTab === "reminders" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Reminder Settings</h2>
              <ReminderSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'reminders')}
              />
            </Card>
          )}
          
          {activeTab === "notifications" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
              <NotificationSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'notifications')}
              />
            </Card>
          )}
          
          {activeTab === "integrations" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Integration Settings</h2>
              <IntegrationSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'integrations')}
              />
            </Card>
          )}
          
          {activeTab === "billing" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Billing Settings</h2>
              <BillingSettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'billing')}
              />
            </Card>
          )}
          
          {activeTab === "security" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              <SecuritySettings 
                settings={settings}
                setSettings={setSettings}
                loading={loading}
                onSave={(updatedSettings) => handleSaveSettings(updatedSettings, 'security')}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
