
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/pages/Settings";

interface ProfileSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const ProfileSettings = ({ settings, setSettings, loading }: ProfileSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(settings.profile.name);
  const [email, setEmail] = useState(settings.profile.email);
  const { user } = useAuth();
  const { toast } = useToast();

  // Update user profile when form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name
        }
      });

      if (updateError) throw updateError;

      // Update local state
      setSettings({
        ...settings,
        profile: {
          ...settings.profile,
          name
        }
      });

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Function to handle avatar upload (placeholder for future implementation)
  const handleAvatarUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Avatar upload functionality will be available soon!"
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">User Info</h3>
      
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={settings.profile.avatarUrl || ""} />
            <AvatarFallback className="text-lg">{getInitials(settings.profile.name || "User")}</AvatarFallback>
          </Avatar>
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute bottom-0 right-0 rounded-full" 
            onClick={handleAvatarUpload}
          >
            Edit
          </Button>
        </div>
        
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-medium">{settings.profile.name || "User"}</h4>
          <p className="text-sm text-muted-foreground">{settings.profile.email}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Your name"
            disabled={loading || saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            value={email} 
            disabled={true}
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email changes require re-verification</p>
        </div>
        
        <div className="pt-4">
          <Button type="submit" disabled={loading || saving || !name}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
