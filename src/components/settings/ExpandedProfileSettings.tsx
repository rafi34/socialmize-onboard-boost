import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/pages/Settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, Mail, Link as LinkIcon, MapPin, Twitter, Instagram, 
  Youtube, Facebook, Linkedin, Github
} from "lucide-react";

interface ExpandedProfileSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  loading: boolean;
}

type SocialLink = {
  platform: string;
  url: string;
  icon: React.ReactNode;
  placeholder: string;
};

export const ExpandedProfileSettings = ({ 
  settings, 
  setSettings, 
  loading 
}: ExpandedProfileSettingsProps) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    name: settings.profile.name || "",
    email: settings.profile.email || "",
    bio: settings.profile.bio || "",
    location: settings.profile.location || "",
    website: settings.profile.website || "",
    twitter: settings.profile.socialLinks?.twitter || "",
    instagram: settings.profile.socialLinks?.instagram || "",
    youtube: settings.profile.socialLinks?.youtube || "",
    facebook: settings.profile.socialLinks?.facebook || "",
    linkedin: settings.profile.socialLinks?.linkedin || "",
    github: settings.profile.socialLinks?.github || "",
  });
  
  const { user } = useAuth();

  useEffect(() => {
    // Update form data when settings change
    setFormData({
      name: settings.profile.name || "",
      email: settings.profile.email || "",
      bio: settings.profile.bio || "",
      location: settings.profile.location || "",
      website: settings.profile.website || "",
      twitter: settings.profile.socialLinks?.twitter || "",
      instagram: settings.profile.socialLinks?.instagram || "",
      youtube: settings.profile.socialLinks?.youtube || "",
      facebook: settings.profile.socialLinks?.facebook || "",
      linkedin: settings.profile.socialLinks?.linkedin || "",
      github: settings.profile.socialLinks?.github || "",
    });
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update user profile when form is submitted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          social_links: {
            twitter: formData.twitter,
            instagram: formData.instagram,
            youtube: formData.youtube,
            facebook: formData.facebook,
            linkedin: formData.linkedin,
            github: formData.github,
          }
        }
      });

      if (updateError) throw updateError;

      // Update local state with new values
      setSettings({
        ...settings,
        profile: {
          ...settings.profile,
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          socialLinks: {
            twitter: formData.twitter,
            instagram: formData.instagram,
            youtube: formData.youtube,
            facebook: formData.facebook,
            linkedin: formData.linkedin,
            github: formData.github,
          }
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

  const socialLinks: SocialLink[] = [
    {
      platform: "twitter",
      url: formData.twitter,
      icon: <Twitter className="h-4 w-4" />,
      placeholder: "Twitter profile URL"
    },
    {
      platform: "instagram",
      url: formData.instagram,
      icon: <Instagram className="h-4 w-4" />,
      placeholder: "Instagram profile URL"
    },
    {
      platform: "youtube",
      url: formData.youtube,
      icon: <Youtube className="h-4 w-4" />,
      placeholder: "YouTube channel URL"
    },
    {
      platform: "facebook",
      url: formData.facebook,
      icon: <Facebook className="h-4 w-4" />,
      placeholder: "Facebook profile URL"
    },
    {
      platform: "linkedin",
      url: formData.linkedin,
      icon: <Linkedin className="h-4 w-4" />,
      placeholder: "LinkedIn profile URL"
    },
    {
      platform: "github",
      url: formData.github,
      icon: <Github className="h-4 w-4" />,
      placeholder: "GitHub profile URL"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={settings.profile.avatarUrl || ""} />
            <AvatarFallback className="text-lg bg-socialmize-purple text-white">
              {getInitials(settings.profile.name || "User")}
            </AvatarFallback>
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
          {settings.profile.bio && (
            <p className="text-sm text-muted-foreground">{settings.profile.bio}</p>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Social Profiles
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="basic" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name} 
                        onChange={handleInputChange} 
                        placeholder="Your name"
                        disabled={loading || saving}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        value={formData.email} 
                        disabled={true}
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email changes require re-verification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      name="bio"
                      value={formData.bio} 
                      onChange={handleInputChange} 
                      placeholder="Tell us about yourself"
                      rows={3}
                      className="resize-none"
                      disabled={loading || saving}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          id="location" 
                          name="location"
                          value={formData.location} 
                          onChange={handleInputChange} 
                          placeholder="Your location"
                          disabled={loading || saving}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <LinkIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          id="website" 
                          name="website"
                          value={formData.website} 
                          onChange={handleInputChange} 
                          placeholder="https://yourwebsite.com"
                          disabled={loading || saving}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {socialLinks.map((social) => (
                    <div key={social.platform} className="space-y-2">
                      <Label htmlFor={social.platform} className="flex items-center gap-2">
                        {social.icon}
                        {social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
                      </Label>
                      <Input 
                        id={social.platform} 
                        name={social.platform}
                        value={social.url} 
                        onChange={handleInputChange} 
                        placeholder={social.placeholder}
                        disabled={loading || saving}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <div className="pt-6">
            <Button type="submit" disabled={loading || saving || !formData.name}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
};

export default ExpandedProfileSettings;
