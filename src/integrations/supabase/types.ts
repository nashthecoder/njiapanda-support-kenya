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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          conductor_id: string | null
          id: string
          notes: string | null
          risk_level: string | null
          signal_id: string | null
          status: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          conductor_id?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          signal_id?: string | null
          status?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          conductor_id?: string | null
          id?: string
          notes?: string | null
          risk_level?: string | null
          signal_id?: string | null
          status?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      conductors: {
        Row: {
          active: boolean | null
          id: string
          name: string
          role: string | null
          zone: string | null
        }
        Insert: {
          active?: boolean | null
          id?: string
          name: string
          role?: string | null
          zone?: string | null
        }
        Update: {
          active?: boolean | null
          id?: string
          name?: string
          role?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          contribution_count: number
          id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          contribution_count?: number
          id?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          contribution_count?: number
          id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          zone?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          contact: string | null
          hours: string | null
          id: string
          name: string
          type: string | null
          verified: boolean | null
          zone: string | null
        }
        Insert: {
          contact?: string | null
          hours?: string | null
          id?: string
          name: string
          type?: string | null
          verified?: boolean | null
          zone?: string | null
        }
        Update: {
          contact?: string | null
          hours?: string | null
          id?: string
          name?: string
          type?: string | null
          verified?: boolean | null
          zone?: string | null
        }
        Relationships: []
      }
      safe_houses: {
        Row: {
          capacity_status: string | null
          id: string
          type: string | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          capacity_status?: string | null
          id?: string
          type?: string | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          capacity_status?: string | null
          id?: string
          type?: string | null
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          consent: boolean | null
          created_at: string
          id: string
          resource_needed: string | null
          urgency: string
          zone: string | null
        }
        Insert: {
          consent?: boolean | null
          created_at?: string
          id?: string
          resource_needed?: string | null
          urgency?: string
          zone?: string | null
        }
        Update: {
          consent?: boolean | null
          created_at?: string
          id?: string
          resource_needed?: string | null
          urgency?: string
          zone?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          abuse_type: string | null
          created_at: string
          id: string
          language: string | null
          message: string | null
          resonance_count: number
          source: string | null
          status: string | null
          swahili_text: string | null
          tags: string[] | null
          text: string
          title: string | null
        }
        Insert: {
          abuse_type?: string | null
          created_at?: string
          id?: string
          language?: string | null
          message?: string | null
          resonance_count?: number
          source?: string | null
          status?: string | null
          swahili_text?: string | null
          tags?: string[] | null
          text: string
          title?: string | null
        }
        Update: {
          abuse_type?: string | null
          created_at?: string
          id?: string
          language?: string | null
          message?: string | null
          resonance_count?: number
          source?: string | null
          status?: string | null
          swahili_text?: string | null
          tags?: string[] | null
          text?: string
          title?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conductor_zone: { Args: { _user_id: string }; Returns: string }
      get_my_conductor_zone: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_contribution: { Args: { amount: number }; Returns: undefined }
      increment_resonance: { Args: { story_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "conductor" | "user"
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
    Enums: {
      app_role: ["admin", "conductor", "user"],
    },
  },
} as const
