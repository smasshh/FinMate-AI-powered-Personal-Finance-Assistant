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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          intent: string | null
          message: string
          parsed_data: Json | null
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent?: string | null
          message: string
          parsed_data?: Json | null
          response: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent?: string | null
          message?: string
          parsed_data?: Json | null
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          end_date: string
          id: string
          start_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          chat_type: string
          created_at: string
          id: string
          message: string
          response: string
          user_id: string
        }
        Insert: {
          chat_type: string
          created_at?: string
          id?: string
          message: string
          response: string
          user_id: string
        }
        Update: {
          chat_type?: string
          created_at?: string
          id?: string
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_score: {
        Row: {
          age: number
          annual_income: number
          created_at: string
          credit_utilization: number
          existing_loans: number
          id: string
          payment_history: number
          predicted_score: number
          prediction_date: string
          user_id: string
        }
        Insert: {
          age: number
          annual_income: number
          created_at?: string
          credit_utilization: number
          existing_loans: number
          id?: string
          payment_history: number
          predicted_score: number
          prediction_date?: string
          user_id: string
        }
        Update: {
          age?: number
          annual_income?: number
          created_at?: string
          credit_utilization?: number
          existing_loans?: number
          id?: string
          payment_history?: number
          predicted_score?: number
          prediction_date?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          created_at: string
          id: string
          purchase_date: string
          purchase_price: number
          quantity: number
          stock_symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_date: string
          purchase_price: number
          quantity: number
          stock_symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purchase_date?: string
          purchase_price?: number
          quantity?: number
          stock_symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          created_at: string
          date: string
          id: string
          portfolio_value: number
          positions_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          portfolio_value: number
          positions_data: Json
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          portfolio_value?: number
          positions_data?: Json
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_predictions: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          predicted_price: number
          prediction_date: string
          stock_symbol: string
          user_id: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          predicted_price: number
          prediction_date: string
          stock_symbol: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          predicted_price?: number
          prediction_date?: string
          stock_symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_watchlist: {
        Row: {
          added_at: string
          id: string
          stock_symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          stock_symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          stock_symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_trades: {
        Row: {
          alpaca_order_id: string | null
          executed_at: string
          id: string
          price_at_execution: number
          quantity: number
          status: string
          symbol: string
          trade_type: string
          user_id: string
          via_chatbot: boolean
        }
        Insert: {
          alpaca_order_id?: string | null
          executed_at?: string
          id?: string
          price_at_execution: number
          quantity: number
          status?: string
          symbol: string
          trade_type: string
          user_id: string
          via_chatbot?: boolean
        }
        Update: {
          alpaca_order_id?: string | null
          executed_at?: string
          id?: string
          price_at_execution?: number
          quantity?: number
          status?: string
          symbol?: string
          trade_type?: string
          user_id?: string
          via_chatbot?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
