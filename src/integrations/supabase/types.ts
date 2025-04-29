export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          likes: number | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes?: number | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes?: number | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_ideas: {
        Row: {
          generated_at: string | null
          id: string
          idea: string
          selected: boolean | null
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          id?: string
          idea: string
          selected?: boolean | null
          user_id: string
        }
        Update: {
          generated_at?: string | null
          id?: string
          idea?: string
          selected?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      generated_scripts: {
        Row: {
          content: string
          created_at: string
          format_type: string
          hook: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          format_type: string
          hook?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          format_type?: string
          hook?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_answers: {
        Row: {
          content_format_preference: string | null
          created_at: string
          creator_mission: string | null
          creator_style: string | null
          existing_content: string | null
          id: string
          niche_topic: string | null
          posting_frequency_goal: string | null
          shooting_preference: string | null
          shooting_schedule: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_format_preference?: string | null
          created_at?: string
          creator_mission?: string | null
          creator_style?: string | null
          existing_content?: string | null
          id?: string
          niche_topic?: string | null
          posting_frequency_goal?: string | null
          shooting_preference?: string | null
          shooting_schedule?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_format_preference?: string | null
          created_at?: string
          creator_mission?: string | null
          creator_style?: string | null
          existing_content?: string | null
          id?: string
          niche_topic?: string | null
          posting_frequency_goal?: string | null
          shooting_preference?: string | null
          shooting_schedule?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          onboarding_complete: boolean
          profile_progress: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          onboarding_complete?: boolean
          profile_progress?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          onboarding_complete?: boolean
          profile_progress?: number
          updated_at?: string
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          created_at: string
          current_level: number | null
          current_xp: number | null
          id: string
          last_activity_date: string | null
          streak_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number | null
          current_xp?: number | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number | null
          current_xp?: number | null
          id?: string
          last_activity_date?: string | null
          streak_days?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message: string | null
          reminder_time: string
          reminder_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string | null
          reminder_time: string
          reminder_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string | null
          reminder_time?: string
          reminder_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_onboarding_answers: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_profiles: {
        Row: {
          content_types: Json | null
          created_at: string
          creator_style: string | null
          experience_level: string | null
          first_five_scripts: Json | null
          full_plan_text: string | null
          id: string
          niche_topic: string | null
          posting_frequency: string | null
          topic_ideas: Json | null
          updated_at: string
          user_id: string
          weekly_calendar: Json | null
        }
        Insert: {
          content_types?: Json | null
          created_at?: string
          creator_style?: string | null
          experience_level?: string | null
          first_five_scripts?: Json | null
          full_plan_text?: string | null
          id?: string
          niche_topic?: string | null
          posting_frequency?: string | null
          topic_ideas?: Json | null
          updated_at?: string
          user_id: string
          weekly_calendar?: Json | null
        }
        Update: {
          content_types?: Json | null
          created_at?: string
          creator_style?: string | null
          experience_level?: string | null
          first_five_scripts?: Json | null
          full_plan_text?: string | null
          id?: string
          niche_topic?: string | null
          posting_frequency?: string | null
          topic_ideas?: Json | null
          updated_at?: string
          user_id?: string
          weekly_calendar?: Json | null
        }
        Relationships: []
      }
      used_topics: {
        Row: {
          content_type: string
          id: string
          topic: string
          used_at: string
          user_id: string
        }
        Insert: {
          content_type: string
          id?: string
          topic: string
          used_at?: string
          user_id: string
        }
        Update: {
          content_type?: string
          id?: string
          topic?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_generated_scripts: {
        Args: { user_id_param: string }
        Returns: {
          content: string
          created_at: string
          format_type: string
          hook: string | null
          id: string
          title: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
