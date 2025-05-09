
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { LeaderboardEntry } from "@/types/dashboard";
import { Trophy, Medal, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardUser extends LeaderboardEntry {
  email?: string;
  name?: string;
}

export const LeaderboardSection = () => {
  const { user } = useAuth();
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [user]);
  
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Get top 10 users by XP
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard_entries')
        .select(`
          user_id,
          level,
          xp,
          updated_at,
          profiles:user_id (
            email
          )
        `)
        .order('xp', { ascending: false })
        .limit(10);
        
      if (leaderboardError) throw leaderboardError;
      
      // Format the data
      const formattedData: LeaderboardUser[] = leaderboardData?.map(entry => ({
        user_id: entry.user_id,
        level: entry.level,
        xp: entry.xp,
        updated_at: entry.updated_at,
        email: (entry.profiles as any)?.email || "Unknown",
        name: maskEmail((entry.profiles as any)?.email || "Unknown")
      })) || [];
      
      setLeaderboardUsers(formattedData);
      
      // Find user's rank
      if (user) {
        const userIndex = formattedData.findIndex(entry => entry.user_id === user.id);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        } else {
          // If user not in top 10, get their rank
          const { count: betterUsers, error: countError } = await supabase
            .from('leaderboard_entries')
            .select('*', { count: 'exact', head: true })
            .gt('xp', (formattedData.find(entry => entry.user_id === user.id)?.xp || 0));
            
          if (countError) throw countError;
          
          if (betterUsers !== null) {
            setUserRank(betterUsers + 1);
          }
        }
      }
      
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Mask email for privacy
  const maskEmail = (email: string): string => {
    if (!email || email === "Unknown") return "Creator";
    const [name, domain] = email.split('@');
    if (!domain) return email;
    
    let maskedName = name.length > 2 
      ? name.substring(0, 2) + '***' 
      : name + '***';
      
    return `${maskedName}@${domain.split('.')[0].substring(0, 1)}***`;
  };
  
  // Render medal icon based on position
  const renderPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center font-semibold">{position}</span>;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Creator Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Creator Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboardUsers.length > 0 ? (
          <div className="space-y-1">
            {leaderboardUsers.map((entry, index) => (
              <div 
                key={entry.user_id} 
                className={`flex items-center justify-between py-2 px-3 rounded-md ${
                  entry.user_id === user?.id ? 'bg-socialmize-light-purple' : (index % 2 === 0 ? 'bg-muted/50' : '')
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center mr-3">
                    {renderPositionIcon(index + 1)}
                  </span>
                  <span className="font-medium">
                    {entry.name}
                    {entry.user_id === user?.id && " (You)"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium px-2 py-1 rounded bg-socialmize-brand-light text-socialmize-brand-dark">
                    Lvl {entry.level}
                  </span>
                  <span className="font-semibold">{entry.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No leaderboard data available yet.
          </div>
        )}
        
        {userRank && userRank > 10 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
              <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center mr-3">
                  {userRank}
                </span>
                <span className="font-medium">You</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium px-2 py-1 rounded bg-socialmize-brand-light text-socialmize-brand-dark">
                  Lvl {leaderboardUsers.find(entry => entry.user_id === user?.id)?.level || 1}
                </span>
                <span className="font-semibold">{leaderboardUsers.find(entry => entry.user_id === user?.id)?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full mt-4" 
          size="sm"
          onClick={fetchLeaderboardData}
        >
          Refresh Leaderboard
        </Button>
      </CardContent>
    </Card>
  );
};
