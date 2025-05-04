
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

// Import Settings components
import ProfileSettings from "@/components/settings/ProfileSettings";
import CreatorSettings from "@/components/settings/CreatorSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import BillingSettings from "@/components/settings/BillingSettings";
import ReminderSettings from "@/components/settings/ReminderSettings";

export type UserSettings = {
  profile: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  creatorSettings: {
    creatorMission: string | null;
    creatorStyle: string | null;
    contentPreference: string | null;
    postingFrequency: string | null;
    shootingMode: string | null;
    existingContent: boolean | null;
    nicheTopic: string | null;
  };
  notifications: {
    emailReminders: boolean;
    pushNotifications: boolean;
    weeklySummary: boolean;
    creatorReports: boolean;
  };
  integrations: {
    googleConnected: boolean;
    googleEmail: string | null;
    calendarSync: boolean;
  };
  billing: {
    plan: string;
    hasPaymentMethod: boolean;
  };
};

const initialSettings: UserSettings = {
  profile: {
    name: "",
    email: "",
    avatarUrl: null,
  },
  creatorSettings: {
    creatorMission: null,
    creatorStyle: null,
    contentPreference: null,
    postingFrequency: null,
    shootingMode: null,
    existingContent: null,
    nicheTopic: null,
  },
  notifications: {
    emailReminders: true,
    pushNotifications: false,
    weeklySummary: true,
    creatorReports: true,
  },
  integrations: {
    googleConnected: false,
    googleEmail: null,
    calendarSync: false,
  },
  billing: {
    plan: "Free",
    hasPaymentMethod: false,
  },
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<UserSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Fetch onboarding answers
      const { data: onboardingData } = await supabase
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch strategy profile
      const { data: strategyData } = await supabase
        .from("strategy_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Update settings state with fetched data
      setSettings({
        ...settings,
        profile: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
        creatorSettings: {
          creatorMission: onboardingData?.creator_mission || null,
          creatorStyle: onboardingData?.creator_style || strategyData?.creator_style || null,
          contentPreference: onboardingData?.content_format_preference || null,
          postingFrequency: onboardingData?.posting_frequency_goal || strategyData?.posting_frequency || null,
          shootingMode: onboardingData?.shooting_preference || null,
          existingContent: onboardingData?.existing_content === "true" ? true : 
                         onboardingData?.existing_content === "false" ? false : null,
          nicheTopic: onboardingData?.niche_topic || strategyData?.niche_topic || null,
        }
      });
    } catch (error) {
      console.error("Error fetching user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render mobile view (accordion)
  if (isMobile) {
    return (
      <div className="container py-6 space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Your Settings</h1>
          <p className="text-muted-foreground">Manage your preferences, integrations, and account.</p>
        </div>

        <div className="space-y-4">
          <SettingsAccordion 
            title="Profile" 
            value={activeTab === "profile"} 
            onToggle={() => setActiveTab(activeTab === "profile" ? "" : "profile")}
          >
            <ProfileSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Creator Settings" 
            value={activeTab === "creator"} 
            onToggle={() => setActiveTab(activeTab === "creator" ? "" : "creator")}
          >
            <CreatorSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Reminders" 
            value={activeTab === "reminders"} 
            onToggle={() => setActiveTab(activeTab === "reminders" ? "" : "reminders")}
          >
            <ReminderSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Notifications" 
            value={activeTab === "notifications"} 
            onToggle={() => setActiveTab(activeTab === "notifications" ? "" : "notifications")}
          >
            <NotificationSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Integrations" 
            value={activeTab === "integrations"} 
            onToggle={() => setActiveTab(activeTab === "integrations" ? "" : "integrations")}
          >
            <IntegrationSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Security & Login" 
            value={activeTab === "security"} 
            onToggle={() => setActiveTab(activeTab === "security" ? "" : "security")}
          >
            <SecuritySettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
          
          <SettingsAccordion 
            title="Billing & Payment" 
            value={activeTab === "billing"} 
            onToggle={() => setActiveTab(activeTab === "billing" ? "" : "billing")}
          >
            <BillingSettings settings={settings} setSettings={setSettings} loading={loading} />
          </SettingsAccordion>
        </div>
      </div>
    );
  }

  // Desktop view (tabs)
  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Your Settings</h1>
        <p className="text-muted-foreground">Manage your preferences, integrations, and account.</p>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <TabsList className="flex flex-col h-auto bg-muted p-2 space-y-2">
            <TabsTrigger value="profile" className="justify-start py-3">Profile</TabsTrigger>
            <TabsTrigger value="creator" className="justify-start py-3">Creator Settings</TabsTrigger>
            <TabsTrigger value="reminders" className="justify-start py-3">Reminders</TabsTrigger>
            <TabsTrigger value="notifications" className="justify-start py-3">Notifications</TabsTrigger>
            <TabsTrigger value="integrations" className="justify-start py-3">Integrations</TabsTrigger>
            <TabsTrigger value="security" className="justify-start py-3">Security & Login</TabsTrigger>
            <TabsTrigger value="billing" className="justify-start py-3">Billing & Payment</TabsTrigger>
          </TabsList>
        </div>

        <div className="md:w-3/4">
          <TabsContent value="profile" className="mt-0">
            <Card className="p-6">
              <ProfileSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="creator" className="mt-0">
            <Card className="p-6">
              <CreatorSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="reminders" className="mt-0">
            <Card className="p-6">
              <ReminderSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <Card className="p-6">
              <NotificationSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations" className="mt-0">
            <Card className="p-6">
              <IntegrationSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-0">
            <Card className="p-6">
              <SecuritySettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="mt-0">
            <Card className="p-6">
              <BillingSettings settings={settings} setSettings={setSettings} loading={loading} />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

interface SettingsAccordionProps {
  title: string;
  value: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SettingsAccordion = ({ title, value, onToggle, children }: SettingsAccordionProps) => {
  return (
    <Card>
      <Collapsible open={value} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <ChevronDown className={`h-5 w-5 transition-transform ${value ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default Settings;
