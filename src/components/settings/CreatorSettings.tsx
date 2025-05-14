import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CreatorSettings = () => {
  const { user } = useAuth();
  const [missionValue, setMissionValue] = useState("");
  const [styleValue, setStyleValue] = useState("");
  const [formatValue, setFormatValue] = useState("");
  const [frequencyValue, setFrequencyValue] = useState("");
  const [shootingValue, setShootingValue] = useState("");
  const [nicheValue, setNicheValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCreatorSettings = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('onboarding_answers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Error fetching creator settings:", error);
            return;
          }

          if (data) {
            setMissionValue(data.creator_mission || "");
            setStyleValue(data.creator_style || "");
            setFormatValue(data.content_format_preference || "");
            setFrequencyValue(data.posting_frequency_goal || "");
            setShootingValue(data.shooting_preference || "");
            setNicheValue(data.niche_topic || "");
          }
        } catch (error) {
          console.error("Error fetching creator settings:", error);
        }
      }
    };

    fetchCreatorSettings();
  }, [user]);

  // Fix the property type issue by adding existingContent
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const updateData = {
        creatorMission: missionValue,
        creatorStyle: styleValue,
        contentPreference: formatValue,
        postingFrequency: frequencyValue,
        shootingMode: shootingValue,
        existingContent: true, // Add the missing property
        nicheTopic: nicheValue
      };
      
      const { error } = await supabase
        .from('onboarding_answers')
        .upsert(
          {
            user_id: user?.id,
            creator_mission: missionValue,
            creator_style: styleValue,
            content_format_preference: formatValue,
            posting_frequency_goal: frequencyValue,
            shooting_preference: shootingValue,
            existing_content: true,
            niche_topic: nicheValue,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        throw error;
      }

      toast({
        title: "Settings saved",
        description: "Your creator settings have been updated.",
      });
    } catch (error) {
      console.error("Error updating creator settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem updating your creator settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Creator Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="creatorMission">Creator Mission</Label>
          <Textarea
            id="creatorMission"
            placeholder="What is your mission as a creator?"
            value={missionValue}
            onChange={(e) => setMissionValue(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="creatorStyle">Creator Style</Label>
          <Select value={styleValue} onValueChange={setStyleValue}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Authentic">Authentic</SelectItem>
              <SelectItem value="Educational">Educational</SelectItem>
              <SelectItem value="Humorous">Humorous</SelectItem>
              <SelectItem value="Inspirational">Inspirational</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contentPreference">Content Preference</Label>
          <Select value={formatValue} onValueChange={setFormatValue}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a content preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Images">Images</SelectItem>
              <SelectItem value="Blog Posts">Blog Posts</SelectItem>
              <SelectItem value="Podcasts">Podcasts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="postingFrequency">Posting Frequency Goal</Label>
          <Select value={frequencyValue} onValueChange={setFrequencyValue}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="3-5 times a week">3-5 times a week</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="shootingMode">Shooting Mode Preference</Label>
          <Select value={shootingValue} onValueChange={setShootingValue}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a shooting mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Solo">Solo</SelectItem>
              <SelectItem value="With Friends">With Friends</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nicheTopic">Niche Topic</Label>
          <Input
            type="text"
            id="nicheTopic"
            placeholder="Enter your niche topic"
            value={nicheValue}
            onChange={(e) => setNicheValue(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatorSettings;
