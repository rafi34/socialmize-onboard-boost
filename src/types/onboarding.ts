
// Onboarding process types
export type CreatorMission = 
  | "gain_followers"
  | "get_leads"
  | "grow_personal_brand"
  | "go_viral"
  | "build_community";

export type CreatorStyle = 
  | "bold_energetic"
  | "calm_motivational"
  | "funny_relatable"
  | "inspirational_wise"
  | "raw_authentic";

export type ContentFormat = 
  | "talking_to_camera"
  | "voiceovers"
  | "skits_storytelling"
  | "tutorials_howto"
  | "lifestyle_documentary";

export type PostingFrequency = 
  | "multiple_daily"
  | "daily"
  | "three_to_five_weekly"
  | "one_to_two_weekly"
  | "warming_up";

export type ShootingPreference = 
  | "bulk_shooting"
  | "single_video";

export interface OnboardingAnswers {
  creator_mission: CreatorMission | null;
  creator_style: CreatorStyle | null;
  content_format_preference: ContentFormat | null;
  posting_frequency_goal: PostingFrequency | null;
  existing_content: boolean | null;
  shooting_preference: ShootingPreference | null;
  shooting_schedule?: Date | null;
  shooting_reminder?: boolean | null;
  niche_topic?: string | null;
  onboarding_complete: boolean;
  profile_progress: number;
}

// User progress and gamification
export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  last_post_date: Date | null;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  progress: number;
  xpGain: number;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 0,
    title: "Welcome",
    description: "Start your creator journey",
    progress: 0,
    xpGain: 0,
  },
  {
    id: 1,
    title: "Creator Mission",
    description: "What's your main goal?",
    progress: 10,
    xpGain: 10,
  },
  {
    id: 2,
    title: "Creator Style",
    description: "What's your content style?",
    progress: 20,
    xpGain: 10,
  },
  {
    id: 3,
    title: "Content Creation",
    description: "How do you prefer to create?",
    progress: 35,
    xpGain: 15,
  },
  {
    id: 4,
    title: "Creator Pace",
    description: "How often will you post?",
    progress: 50,
    xpGain: 15,
  },
  {
    id: 5,
    title: "Content Library",
    description: "Do you have existing content?",
    progress: 65,
    xpGain: 15,
  },
  {
    id: 6,
    title: "Content Niche",
    description: "What do you create content about?", 
    progress: 75,
    xpGain: 15,
  },
  {
    id: 7,
    title: "Shooting Mode",
    description: "How do you film your content?",
    progress: 90,
    xpGain: 15,
  },
  {
    id: 8,
    title: "You're an OG Creator!",
    description: "Ready for your first viral moment",
    progress: 100,
    xpGain: 100,
  },
];
