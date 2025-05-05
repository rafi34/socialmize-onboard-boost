
export interface InboxItem {
  id: string;
  user_id: string;
  item_type: 'script' | 'idea' | 'reminder' | 'ai_message' | 'nudge';
  title: string;
  description?: string;
  action_text?: string;
  action_link?: string;
  is_read: boolean;
  is_completed: boolean;
  source_id?: string;
  created_at: string;
  due_at?: string;
  xp_reward?: number;
  streak_effect?: boolean;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export type InboxFilter = 'all' | 'unread' | 'week' | 'action';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockCriteria: string;
  xpReward: number;
  category: 'onboarding' | 'streak' | 'content' | 'social' | 'level';
  level?: number;
  unlockedAt?: string;
}

export type BadgeFilter = 'all' | 'unlocked' | 'locked' | 'upcoming';
