
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Awards XP to a user and handles level progression
 */
export async function awardXp(userId: string, event: string, amount: number): Promise<{success: boolean, newXp?: number, newLevel?: number}> {
  if (!userId) return { success: false };
  
  try {
    // Record the XP event
    await supabase.from('xp_progress').insert({
      user_id: userId,
      event,
      xp_earned: amount,
    });
    
    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;
    
    // Calculate new XP and potential level up
    const currentXp = profile?.xp || 0;
    const currentLevel = profile?.level || 1;
    const newXp = currentXp + amount;
    
    // Check if user leveled up (simple formula: need 100*level XP to level up)
    const xpNeededForNextLevel = currentLevel * 100;
    const shouldLevelUp = newXp >= xpNeededForNextLevel;
    const newLevel = shouldLevelUp ? currentLevel + 1 : currentLevel;
    
    // Update profile with new XP and level
    await supabase
      .from('profiles')
      .update({
        xp: newXp,
        level: newLevel,
      })
      .eq('id', userId);
    
    // Update leaderboard entry - no longer needed as we're using the profiles table
    // The profiles table already has the XP and level information
    
    // Track user action
    if (shouldLevelUp) {
      await trackUserAction(userId, 'level_up', {
        previous_level: currentLevel,
        new_level: newLevel,
        xp_at_levelup: newXp,
      });
      
      // Show level up toast
      toast({
        title: `Level Up! 🎉`,
        description: `You've reached level ${newLevel}!`,
        variant: "default",
      });
    }
    
    return {
      success: true,
      newXp,
      newLevel,
    };
    
  } catch (error) {
    console.error("Error awarding XP:", error);
    return { success: false };
  }
}

/**
 * Tracks a user action in the user_actions table
 */
export async function trackUserAction(userId: string, action: string, metadata: any = {}): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { error } = await supabase.from('user_actions').insert({
      user_id: userId,
      action,
      metadata,
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error tracking user action:", error);
    return false;
  }
}

/**
 * Gets the XP needed for the next level
 */
export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

/**
 * Calculates percentage progress to next level
 */
export function calculateLevelProgress(xp: number, level: number): number {
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  return Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));
}
