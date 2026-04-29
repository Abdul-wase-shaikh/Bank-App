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
      accounts: {
        Row: {
          account_number: string
          balance: number
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          account_number: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          user_id: string
        }
        Update: {
          account_number?: string
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          amount: number
          biller_id: string | null
          biller_name: string
          category: Database["public"]["Enums"]["bill_category"]
          created_at: string
          id: string
          paid_at: string
          period_label: string | null
          status: Database["public"]["Enums"]["bill_payment_status"]
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          biller_id?: string | null
          biller_name: string
          category: Database["public"]["Enums"]["bill_category"]
          created_at?: string
          id?: string
          paid_at?: string
          period_label?: string | null
          status?: Database["public"]["Enums"]["bill_payment_status"]
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          biller_id?: string | null
          biller_name?: string
          category?: Database["public"]["Enums"]["bill_category"]
          created_at?: string
          id?: string
          paid_at?: string
          period_label?: string | null
          status?: Database["public"]["Enums"]["bill_payment_status"]
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_biller_id_fkey"
            columns: ["biller_id"]
            isOneToOne: false
            referencedRelation: "billers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      billers: {
        Row: {
          account_ref: string | null
          autopay: boolean
          autopay_max: number | null
          category: Database["public"]["Enums"]["bill_category"]
          created_at: string
          default_amount: number | null
          due_day: number | null
          id: string
          name: string
          notes: string | null
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_ref?: string | null
          autopay?: boolean
          autopay_max?: number | null
          category: Database["public"]["Enums"]["bill_category"]
          created_at?: string
          default_amount?: number | null
          due_day?: number | null
          id?: string
          name: string
          notes?: string | null
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_ref?: string | null
          autopay?: boolean
          autopay_max?: number | null
          category?: Database["public"]["Enums"]["bill_category"]
          created_at?: string
          default_amount?: number | null
          due_day?: number | null
          id?: string
          name?: string
          notes?: string | null
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_events: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          ip: string | null
          is_suspicious: boolean
          method: Database["public"]["Enums"]["login_method"]
          outcome: Database["public"]["Enums"]["login_outcome"]
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          is_suspicious?: boolean
          method: Database["public"]["Enums"]["login_method"]
          outcome: Database["public"]["Enums"]["login_outcome"]
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip?: string | null
          is_suspicious?: boolean
          method?: Database["public"]["Enums"]["login_method"]
          outcome?: Database["public"]["Enums"]["login_outcome"]
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pin_attempts: {
        Row: {
          failed_count: number
          last_failed_at: string | null
          locked_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          failed_count?: number
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          failed_count?: number
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pin_reset_otps: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_revocations: {
        Row: {
          revoked_at: string
          user_id: string
        }
        Insert: {
          revoked_at?: string
          user_id: string
        }
        Update: {
          revoked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          from_account: string | null
          id: string
          status: Database["public"]["Enums"]["tx_status"]
          to_account: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          from_account?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tx_status"]
          to_account?: string | null
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          from_account?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tx_status"]
          to_account?: string | null
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      txn_pin_attempts: {
        Row: {
          failed_count: number
          last_failed_at: string | null
          locked_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          failed_count?: number
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          failed_count?: number
          last_failed_at?: string | null
          locked_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      txn_pin_reset_otps: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      txn_pins: {
        Row: {
          created_at: string
          last_changed_at: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_changed_at?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_changed_at?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string
          last_changed_at: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_changed_at?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_changed_at?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
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
      process_banking_action: {
        Args: {
          _action: Database["public"]["Enums"]["tx_type"]
          _amount: number
          _description?: string
          _to_account?: string
          _user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      bill_category:
        | "mobile_prepaid"
        | "mobile_postpaid"
        | "dth"
        | "broadband"
        | "landline"
        | "electricity"
        | "water"
        | "lpg"
        | "piped_gas"
        | "rent"
        | "society"
        | "property_tax"
        | "credit_card"
        | "loan_emi"
        | "ott"
        | "music"
        | "gaming"
        | "other_subscription"
        | "other"
      bill_payment_status: "pending" | "completed" | "failed"
      login_method: "password" | "pin" | "biometric" | "pin_reset"
      login_outcome: "success" | "failed" | "locked"
      tx_status: "pending" | "completed" | "failed"
      tx_type: "deposit" | "withdraw" | "transfer"
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
      app_role: ["admin", "user"],
      bill_category: [
        "mobile_prepaid",
        "mobile_postpaid",
        "dth",
        "broadband",
        "landline",
        "electricity",
        "water",
        "lpg",
        "piped_gas",
        "rent",
        "society",
        "property_tax",
        "credit_card",
        "loan_emi",
        "ott",
        "music",
        "gaming",
        "other_subscription",
        "other",
      ],
      bill_payment_status: ["pending", "completed", "failed"],
      login_method: ["password", "pin", "biometric", "pin_reset"],
      login_outcome: ["success", "failed", "locked"],
      tx_status: ["pending", "completed", "failed"],
      tx_type: ["deposit", "withdraw", "transfer"],
    },
  },
} as const
