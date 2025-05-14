import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/pages/Settings";

interface SecuritySettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

const SecuritySettings = ({ settings, setSettings, loading }: SecuritySettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { user } = useAuth();

  // Check if user is using email/password auth (not OAuth)
  const usingEmailAuth = user?.app_metadata?.provider === "email" || !user?.app_metadata?.provider;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usingEmailAuth) return;
    
    // Validate passwords
    if (newPassword.length < 6) {
      toast({
        title: "Password error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
      
      // Clear form
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = () => {
    // Placeholder for future 2FA implementation
    toast({
      title: "Coming Soon",
      description: "Two-factor authentication will be available in a future update."
    });
  };

  // Determine login method display name
  const getLoginMethod = () => {
    if (!user) return "Not signed in";
    
    const provider = user.app_metadata?.provider;
    if (provider === "google") return "Google";
    if (provider === "apple") return "Apple";
    return "Email & Password";
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Account Access</h3>
      
      <div className="space-y-2">
        <Label>Current Login Method</Label>
        <div className="p-3 bg-muted rounded-md">
          {getLoginMethod()}
        </div>
      </div>
      
      {usingEmailAuth && (
        <form onSubmit={handleChangePassword} className="space-y-4 border-t pt-6">
          <h4 className="text-lg font-medium">Change Password</h4>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading || saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input 
              id="confirm-password" 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading || saving}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || saving || !newPassword || !confirmPassword}
          >
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </form>
      )}
      
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="two-factor-auth">Two-Factor Authentication</Label>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
          <Switch 
            id="two-factor-auth"
            checked={twoFactorEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
