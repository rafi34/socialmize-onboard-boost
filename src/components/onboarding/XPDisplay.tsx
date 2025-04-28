
import { useOnboarding } from "@/contexts/OnboardingContext";

export const XPDisplay = () => {
  const { userProgress } = useOnboarding();
  
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <div className="bg-socialmize-light-purple px-3 py-1 rounded-full text-socialmize-purple">
        Level {Math.floor(userProgress.xp / 100)}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-socialmize-purple font-bold">⚡</span>
        <span>{userProgress.xp} XP</span>
      </div>
    </div>
  );
};
