export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      plan_feedback: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          feedback_text: string | null
          hours_per_week: number
          id: string
          invalid_resources: number | null
          level: string
          model_version: string | null
          overall_rating: number | null
          plan_generation_time_ms: number | null
          progression_rating: number | null
          relevance_rating: number | null
          resource_quality_rating: number | null
          resources_completed: number | null
          temperature: number | null
          topic: string
          total_resources: number | null
          user_session_id: string | null
          valid_resources: number | null
          weeks: number
          what_needs_improvement: string | null
          what_worked_well: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          feedback_text?: string | null
          hours_per_week: number
          id?: string
          invalid_resources?: number | null
          level: string
          model_version?: string | null
          overall_rating?: number | null
          plan_generation_time_ms?: number | null
          progression_rating?: number | null
          relevance_rating?: number | null
          resource_quality_rating?: number | null
          resources_completed?: number | null
          temperature?: number | null
          topic: string
          total_resources?: number | null
          user_session_id?: string | null
          valid_resources?: number | null
          weeks: number
          what_needs_improvement?: string | null
          what_worked_well?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          feedback_text?: string | null
          hours_per_week?: number
          id?: string
          invalid_resources?: number | null
          level?: string
          model_version?: string | null
          overall_rating?: number | null
          plan_generation_time_ms?: number | null
          progression_rating?: number | null
          relevance_rating?: number | null
          resource_quality_rating?: number | null
          resources_completed?: number | null
          temperature?: number | null
          topic?: string
          total_resources?: number | null
          user_session_id?: string | null
          valid_resources?: number | null
          weeks?: number
          what_needs_improvement?: string | null
          what_worked_well?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          hours_per_week: number
          id: string
          level: string
          plan_data: Json
          topic: string
          updated_at: string
          user_id: string
          weeks: number
        }
        Insert: {
          created_at?: string
          hours_per_week: number
          id?: string
          level: string
          plan_data: Json
          topic: string
          updated_at?: string
          user_id: string
          weeks: number
        }
        Update: {
          created_at?: string
          hours_per_week?: number
          id?: string
          level?: string
          plan_data?: Json
          topic?: string
          updated_at?: string
          user_id?: string
          weeks?: number
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string
          id: string
          resource_id: number
          topic: string
          user_id: string
          week_number: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string
          id?: string
          resource_id: number
          topic: string
          user_id: string
          week_number: number
        }
        Update: {
          completed?: boolean
          completed_at?: string
          id?: string
          resource_id?: number
          topic?: string
          user_id?: string
          week_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      feedback_analytics: {
        Row: {
          avg_completion: number | null
          avg_overall_rating: number | null
          avg_progression: number | null
          avg_relevance: number | null
          avg_resource_quality: number | null
          avg_url_success_rate: number | null
          first_feedback: string | null
          last_feedback: string | null
          level: string | null
          topic: string | null
          total_feedback: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_feedback_insights: {
        Args: { p_max_rating?: number; p_min_rating?: number; p_topic?: string }
        Returns: {
          avg_rating: number
          common_improvements: string
          sample_size: number
          topic: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
