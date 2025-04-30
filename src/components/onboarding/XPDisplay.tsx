
import { useOnboarding } from "@/contexts/OnboardingContext";

export const XPDisplay = () => {
  const { userProgress } = useOnboarding();
  
  // Calculate level based on XP (100 XP per level)
  const level = Math.floor(userProgress.xp / 100) + 1;
  
  // Calculate XP needed for next level
  const nextLevelXp = level * 100;
  
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <div className="bg-socialmize-light-purple px-3 py-1 rounded-full text-socialmize-purple">
        Level {level}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-socialmize-purple font-bold">⚡</span>
        <span>{userProgress.xp} / {nextLevelXp} XP</span>
      </div>
    </div>
  );
};
