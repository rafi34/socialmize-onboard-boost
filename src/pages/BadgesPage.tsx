import { useState, useEffect } from "react";
import { Badge } from "@/types/inbox";
import { PageHeader } from "@/components/PageHeader";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeFilters } from "@/components/badges/BadgeFilters";
import { BadgeSummary } from "@/components/badges/BadgeSummary";
import { NextBadge } from "@/components/badges/NextBadge";
import { Badge as BadgeIcon, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ReminderConfetti } from "@/components/dashboard/ReminderConfetti";
import { useNavigate } from "react-router-dom";

// Mock badges data - in a real app, this would come from your API
const MOCK_BADGES: Badge[] = [
  {
    id: "1",
    title: "Welcome Aboard",
    description: "Completed the onboarding process",
    icon: "trophy",
    isUnlocked: true,
    unlockCriteria: "Complete onboarding",
    xpReward: 50,
    category: "onboarding",
    unlockedAt: "2023-04-15T10:30:00Z"
  },
  {
    id: "2",
    title: "First Script",
    description: "Generated your first content script",
    icon: "sparkles",
    isUnlocked: true,
    unlockCriteria: "Generate a script",
    xpReward: 75,
    category: "content",
    unlockedAt: "2023-04-16T14:20:00Z"
  },
  {
    id: "3",
    title: "Strategy Master",
    description: "Created your content strategy",
    icon: "star",
    isUnlocked: true,
    unlockCriteria: "Create a content strategy",
    xpReward: 100,
    category: "content",
    unlockedAt: "2023-04-17T09:15:00Z"
  },
  {
    id: "4",
    title: "3-Day Streak",
    description: "Posted content 3 days in a row",
    icon: "sparkles",
    isUnlocked: false,
    unlockCriteria: "Post 3 days in a row",
    xpReward: 150,
    category: "streak"
  },
  {
    id: "5",
    title: "7-Day Streak",
    description: "Posted content 7 days in a row",
    icon: "trophy",
    isUnlocked: false,
    unlockCriteria: "Post 7 days in a row",
    xpReward: 300,
    category: "streak"
  },
  {
    id: "6",
    title: "1,000 Followers",
    description: "Reached 1,000 followers on your platform",
    icon: "star",
    isUnlocked: false,
    unlockCriteria: "Reach 1,000 followers",
    xpReward: 500,
    category: "social"
  },
  {
    id: "7",
    title: "Level 5 Creator",
    description: "Reached level 5 in SocialMize",
    icon: "trophy",
    isUnlocked: false,
    unlockCriteria: "Reach level 5",
    xpReward: 250,
    category: "level",
    level: 5
  },
  {
    id: "8",
    title: "Content Mix Master",
    description: "Created content in 5 different formats",
    icon: "sparkles",
    isUnlocked: false,
    unlockCriteria: "Use 5 different formats",
    xpReward: 200,
    category: "content"
  },
  {
    id: "9",
    title: "Trending Creator",
    description: "Had a post reach trending status",
    icon: "star",
    isUnlocked: false,
    unlockCriteria: "Get a trending post",
    xpReward: 400,
    category: "social"
  }
];

export default function BadgesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>(MOCK_BADGES);
  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked" | "upcoming">("all");
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

  // Get counts for filters
  const unlockedBadges = badges.filter(badge => badge.isUnlocked);
  const lockedBadges = badges.filter(badge => !badge.isUnlocked);
  const upcomingBadges = badges.filter(badge => !badge.isUnlocked).slice(0, 3);

  const counts = {
    unlocked: unlockedBadges.length,
    locked: lockedBadges.length,
    upcoming: upcomingBadges.length,
    total: badges.length
  };

  // Calculate total XP from badges
  const totalXpFromBadges = unlockedBadges.reduce((sum, badge) => sum + badge.xpReward, 0);

  // Get the next badge to unlock
  const nextBadgeToUnlock = lockedBadges[0];

  // Filter badges based on active filter
  const filteredBadges = badges.filter(badge => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unlocked") return badge.isUnlocked;
    if (activeFilter === "locked") return !badge.isUnlocked;
    if (activeFilter === "upcoming") return !badge.isUnlocked;
    return true;
  });

  // Simulate unlocking a badge (just for demo)
  const unlockRandomBadge = () => {
    const lockedBadgesIds = badges.filter(badge => !badge.isUnlocked).map(badge => badge.id);
    if (lockedBadgesIds.length === 0) {
      toast({
        title: "All badges unlocked",
        description: "You've already unlocked all the available badges!",
      });
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * lockedBadgesIds.length);
    const badgeIdToUnlock = lockedBadgesIds[randomIndex];
    
    const updatedBadges = badges.map(badge => {
      if (badge.id === badgeIdToUnlock) {
        const unlockedBadge = {
          ...badge,
          isUnlocked: true,
          unlockedAt: new Date().toISOString()
        };
        setNewlyUnlockedBadge(unlockedBadge);
        return unlockedBadge;
      }
      return badge;
    });
    
    setBadges(updatedBadges);
    setShowConfetti(true);
    
    toast({
      title: "🎉 New Badge Unlocked!",
      description: `You've unlocked the "${badges.find(b => b.id === badgeIdToUnlock)?.title}" badge!`,
    });
    
    // Hide confetti after a few seconds
    setTimeout(() => {
      setShowConfetti(false);
      setNewlyUnlockedBadge(null);
    }, 5000);
  };

  const handleNextBadgeAction = () => {
    if (nextBadgeToUnlock.category === 'streak') {
      navigate('/calendar');
    } else if (nextBadgeToUnlock.category === 'content') {
      navigate('/scripts');
    } else if (nextBadgeToUnlock.category === 'social') {
      toast({
        title: "Create great content!",
        description: "Keep creating and sharing content to grow your audience.",
      });
    } else if (nextBadgeToUnlock.category === 'level') {
      navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="container py-8">
      {showConfetti && <ReminderConfetti active={true} />}
      
      <PageHeader
        title="Badges & Achievements"
        description="Track your progress and earn rewards for your content creation journey"
        icon={<BadgeIcon className="h-8 w-8" />}
      />
      
      <BadgeSummary 
        unlockedCount={unlockedBadges.length}
        totalCount={badges.length}
        totalXp={totalXpFromBadges}
        level={5} // This would come from user progress data
      />
      
      {nextBadgeToUnlock && (
        <NextBadge 
          badge={nextBadgeToUnlock} 
          onActionClick={handleNextBadgeAction}
        />
      )}
      
      <BadgeFilters 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />
      
      {/* For demo purposes only - remove in production */}
      <div className="mb-6 flex justify-end">
        <button 
          onClick={unlockRandomBadge}
          className="text-xs text-socialmize-purple hover:underline"
        >
          (Demo: Unlock random badge)
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
      
      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No badges found</h3>
          <p className="text-muted-foreground">
            {activeFilter === "unlocked" 
              ? "You haven't unlocked any badges yet. Keep using SocialMize to earn badges!" 
              : "No badges match the current filter."}
          </p>
        </div>
      )}
    </div>
  );
}
