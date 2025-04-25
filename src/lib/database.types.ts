export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string
          created_at: string
          original_price: number
          selling_price: number
          profit: number
          profit_per_person: number
          note: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          original_price: number
          selling_price: number
          profit: number
          profit_per_person: number
          note?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          original_price?: number
          selling_price?: number
          profit?: number
          profit_per_person?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reset_dates: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id?: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          created_at: string
          user_id: string
          theme: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          theme: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          theme?: string
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