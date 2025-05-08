// Strategy and planning types
export interface StrategyData {
  id?: string;
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
  summary?: string;
  strategy_type?: string;
  is_active?: boolean;
  confirmed_at?: string;
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

// Performance analytics types
export interface PerformanceData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers_gained: number;
  engagement_rate: number;
  period: 'day' | 'week' | 'month' | 'year';
  date: string;
}

// Content strategy visualization
export interface ContentTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface TopicProgress {
  total: number;
  used: number;
  remaining: number;
  percentage: number;
}

export interface WeekdayPostingSchedule {
  day: string;
  count: number;
}

// New interfaces for the new tables:

export interface XpProgressEvent {
  id: string;
  user_id: string;
  event: string;
  xp_earned: number;
  created_at: string;
}

export interface UserAction {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PostMetric {
  id: string;
  user_id: string;
  platform: string;
  post_id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  posted_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  level: number;
  xp: number;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
}

export interface BrandingConfig {
  id: string;
  client_id: string;
  logo_url?: string;
  primary_color?: string;
  font_family?: string;
  app_name?: string;
  created_at: string;
}
