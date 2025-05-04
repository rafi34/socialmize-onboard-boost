
// Strategy and planning types
export interface StrategyData {
  experience_level: string;
  content_types: string[];
  weekly_calendar: Record<string, string[]>;
  starter_scripts?: { title: string; script: string }[];
  posting_frequency: string;
  creator_style: string;
  content_breakdown: Record<string, number>;
  full_plan_text?: string;
  niche_topic?: string;
  topic_ideas?: string[];
  summary?: string; // Added summary property
}

// Progress and gamification
export interface ProgressData {
  current_xp: number;
  current_level: number;
  streak_days: number;
  last_activity_date: string;
  xp_next_level: number;
  level_tag: string;
}

// User reminders
export interface ReminderData {
  id: string;
  user_id: string;
  reminder_type: string;
  reminder_time: string;
  message?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  calendar_event_id?: string | null;
  completed?: boolean;
  xp_awarded?: boolean;
  content_format?: string;
  content_title?: string;
}

// Content generation types
export interface GeneratedScript {
  id: string;
  user_id: string;
  title: string;
  content: string;
  format_type: string;
  hook?: string;
  topic?: string;
  created_at: string;
}
