
export interface StrategyData {
  experience_level?: string;
  content_types?: string[];
  weekly_calendar?: Record<string, string[]>;
  starter_scripts?: { title: string; script: string }[];
}

export interface ProgressData {
  current_xp: number;
  current_level: number;
  streak_days: number;
  last_activity_date: string;
}
