
export interface StrategyData {
  experience_level?: string;
  content_types?: string[];
  weekly_calendar?: Record<string, string[]>;
  starter_scripts?: { title: string; script: string }[];
  posting_frequency?: string;
  creator_style?: string;
  content_breakdown?: Record<string, number>;
}

export interface ProgressData {
  current_xp: number;
  current_level: number;
  streak_days: number;
  last_activity_date: string;
  xp_next_level?: number;
  level_tag?: string;
}

export interface ReminderData {
  id: string;
  reminder_type: string;
  reminder_time: string;
  message?: string;
  is_active: boolean;
}

export interface GeneratedScript {
  id: string;
  title: string;
  hook: string;
  content: string;
  format_type: string;
  created_at: string;
}
