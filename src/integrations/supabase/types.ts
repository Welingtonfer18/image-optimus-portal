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
      evaluation_criteria: {
        Row: {
          description: string | null
          id: number
          max_score: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          max_score: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          max_score?: number
          name?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          content_type: string
          created_at: string | null
          credits_used: number | null
          expires_at: string | null
          id: string
          optimized_at: string | null
          optimized_path: string | null
          optimized_size: number | null
          original_filename: string
          original_path: string
          original_size: number | null
          user_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          credits_used?: number | null
          expires_at?: string | null
          id?: string
          optimized_at?: string | null
          optimized_path?: string | null
          optimized_size?: number | null
          original_filename: string
          original_path: string
          original_size?: number | null
          user_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          credits_used?: number | null
          expires_at?: string | null
          id?: string
          optimized_at?: string | null
          optimized_path?: string | null
          optimized_size?: number | null
          original_filename?: string
          original_path?: string
          original_size?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      keywords: {
        Row: {
          category: string
          created_at: string | null
          id: number
          word: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: number
          word: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: number
          word?: string
        }
        Relationships: []
      }
      resume_analysis_results: {
        Row: {
          created_at: string | null
          criteria_id: number | null
          details: Json | null
          id: string
          resume_id: string | null
          score: number
        }
        Insert: {
          created_at?: string | null
          criteria_id?: number | null
          details?: Json | null
          id?: string
          resume_id?: string | null
          score: number
        }
        Update: {
          created_at?: string | null
          criteria_id?: number | null
          details?: Json | null
          id?: string
          resume_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_analysis_results_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_analysis_results_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          content_type: string
          created_at: string | null
          expires_at: string | null
          file_path: string
          filename: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          expires_at?: string | null
          file_path: string
          filename: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          expires_at?: string | null
          file_path?: string
          filename?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_expired_resumes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
