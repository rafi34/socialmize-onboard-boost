
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { ProgressData } from "@/types/dashboard";

interface ProfileSectionProps {
  user: User | null;
  progress: ProgressData | null;
}

export const ProfileSection = ({ user, progress }: ProfileSectionProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <p className="font-medium">Account Type</p>
              <p className="text-muted-foreground">Creator</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Creator Stats</CardTitle>
          <CardDescription>Your current progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Level</span>
              <span className="bg-socialmize-light-purple px-3 py-1 rounded-full text-socialmize-purple font-medium">
                Level {progress?.current_level || 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>XP</span>
              <span>{progress?.current_xp || 100} XP</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Streak Days</span>
              <span>{progress?.streak_days || 1}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Your achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
            <div className="text-3xl">🏆</div>
            <div>
              <p className="font-medium">OG Creator</p>
              <p className="text-xs text-muted-foreground">Completed onboarding</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
