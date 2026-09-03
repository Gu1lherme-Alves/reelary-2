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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_account_insights: {
        Row: {
          created_at: string | null
          engagement_rate: number | null
          followers_count: number | null
          follows_count: number | null
          id: string
          instagram_account_id: string
          last_synced_at: string | null
          media_count: number | null
          profile_picture_url: string | null
          raw_insights: Json | null
          total_comments: number | null
          total_likes: number | null
          total_reach: number | null
          total_saved: number | null
          total_shares: number | null
          total_views: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          follows_count?: number | null
          id?: string
          instagram_account_id: string
          last_synced_at?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          raw_insights?: Json | null
          total_comments?: number | null
          total_likes?: number | null
          total_reach?: number | null
          total_saved?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          follows_count?: number | null
          id?: string
          instagram_account_id?: string
          last_synced_at?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          raw_insights?: Json | null
          total_comments?: number | null
          total_likes?: number | null
          total_reach?: number | null
          total_saved?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_account_insights_instagram_account_id_fkey"
            columns: ["instagram_account_id"]
            isOneToOne: true
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          access_token: string
          category_id: string | null
          created_at: string
          hidden: boolean
          id: string
          instagram_user_id: string
          profile_picture_url: string | null
          token_expires_at: string | null
          token_invalid: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          category_id?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          instagram_user_id: string
          profile_picture_url?: string | null
          token_expires_at?: string | null
          token_invalid?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          category_id?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          instagram_user_id?: string
          profile_picture_url?: string | null
          token_expires_at?: string | null
          token_invalid?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_media_insights: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          ig_media_id: string
          instagram_account_id: string
          last_synced_at: string | null
          like_count: number | null
          media_type: string | null
          media_url: string | null
          permalink: string | null
          published_at: string | null
          reach_count: number | null
          saved_count: number | null
          shares_count: number | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          ig_media_id: string
          instagram_account_id: string
          last_synced_at?: string | null
          like_count?: number | null
          media_type?: string | null
          media_url?: string | null
          permalink?: string | null
          published_at?: string | null
          reach_count?: number | null
          saved_count?: number | null
          shares_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          ig_media_id?: string
          instagram_account_id?: string
          last_synced_at?: string | null
          like_count?: number | null
          media_type?: string | null
          media_url?: string | null
          permalink?: string | null
          published_at?: string | null
          reach_count?: number | null
          saved_count?: number | null
          shares_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_media_insights_instagram_account_id_fkey"
            columns: ["instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          caption: string
          cover_url: string | null
          created_at: string
          error_message: string | null
          id: string
          ig_container_id: string | null
          instagram_account_id: string
          locked_at: string | null
          published_at: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          caption?: string
          cover_url?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_container_id?: string | null
          instagram_account_id: string
          locked_at?: string | null
          published_at?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          caption?: string
          cover_url?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_container_id?: string | null
          instagram_account_id?: string
          locked_at?: string | null
          published_at?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_instagram_account_id_fkey"
            columns: ["instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          meta_credential_profile: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          meta_credential_profile?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          meta_credential_profile?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grab_pending_posts_to_publish: {
        Args: { limit_count: number }
        Returns: {
          access_token: string
          caption: string
          cover_url: string
          id: string
          ig_container_id: string
          instagram_user_id: string
          scheduled_at: string
          username: string
          video_url: string
        }[]
      }
    }
    Enums: {
      post_status: "pending" | "published" | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      post_status: ["pending", "published", "failed"],
    },
  },
} as const
