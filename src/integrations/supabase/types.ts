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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
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
      villas: {
        Row: {
          id: string
          name: string
          price: number
          image: string
          capacity: number
          description: string | null
          location: Json
          video_url: string | null
          amenities: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          price: number
          image: string
          capacity: number
          description?: string | null
          location?: Json
          video_url?: string | null
          amenities?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          image?: string
          capacity?: number
          description?: string | null
          location?: Json
          video_url?: string | null
          amenities?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          id: string
          title: string
          description: string | null
          discount_percent: number
          villa_id: string | null
          valid_from: string
          valid_to: string
          badge: string | null
          active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          discount_percent: number
          villa_id?: string | null
          valid_from: string
          valid_to: string
          badge?: string | null
          active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          discount_percent?: number
          villa_id?: string | null
          valid_from?: string
          valid_to?: string
          badge?: string | null
          active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_villa_id_fkey"
            columns: ["villa_id"]
            referencedRelation: "villas"
            referencedColumns: ["id"]
          }
        ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_percent: number
          active: boolean | null
          valid_to: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_percent: number
          active?: boolean | null
          valid_to: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_percent?: number
          active?: boolean | null
          valid_to?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          id: string
          villa_id: string
          villa_name: string
          client_id: string | null
          client_name: string
          client_phone: string
          check_in: string
          check_out: string
          status: string
          total_amount: number
          deposit_amount: number
          remaining_amount: number
          payment_method: string | null
          receipt_image: string | null
          payment_note: string | null
          applied_promotion: string | null
          applied_coupon: string | null
          original_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          villa_id: string
          villa_name: string
          client_id?: string | null
          client_name: string
          client_phone: string
          check_in: string
          check_out: string
          status?: string
          total_amount: number
          deposit_amount: number
          remaining_amount: number
          payment_method?: string | null
          receipt_image?: string | null
          payment_note?: string | null
          applied_promotion?: string | null
          applied_coupon?: string | null
          original_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          villa_id?: string
          villa_name?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string
          check_in?: string
          check_out?: string
          status?: string
          total_amount?: number
          deposit_amount?: number
          remaining_amount?: number
          payment_method?: string | null
          receipt_image?: string | null
          payment_note?: string | null
          applied_promotion?: string | null
          applied_coupon?: string | null
          original_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_villa_id_fkey"
            columns: ["villa_id"]
            referencedRelation: "villas"
            referencedColumns: ["id"]
          }
        ]
      }
      incomes: {
        Row: {
          id: string
          date: string
          concept: string
          amount: number
          payment_method: string
          client: string | null
          villa_id: string | null
          income_type: string
          reservation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date?: string
          concept: string
          amount: number
          payment_method: string
          client?: string | null
          villa_id?: string | null
          income_type: string
          reservation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          concept?: string
          amount?: number
          payment_method?: string
          client?: string | null
          villa_id?: string | null
          income_type?: string
          reservation_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_villa_id_fkey"
            columns: ["villa_id"]
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_reservation_id_fkey"
            columns: ["reservation_id"]
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          date: string
          category: string
          description: string
          amount: number
          villa_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date?: string
          category: string
          description: string
          amount: number
          villa_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          category?: string
          description?: string
          amount?: number
          villa_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_villa_id_fkey"
            columns: ["villa_id"]
            referencedRelation: "villas"
            referencedColumns: ["id"]
          }
        ]
      }
      business_settings: {
        Row: {
          id: string
          business_name: string
          rnc: string | null
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          terms: string | null
          bank_info: string | null
          whatsapp_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          rnc?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          terms?: string | null
          bank_info?: string | null
          whatsapp_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          rnc?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          terms?: string | null
          bank_info?: string | null
          whatsapp_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
