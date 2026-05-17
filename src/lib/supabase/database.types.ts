// ============================================================
// QR BELL - Database Types (Generated from Supabase schema)
// Run: supabase gen types typescript --local > src/lib/supabase/database.types.ts
// ============================================================

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
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'admin' | 'superadmin'
          subscription_plan: 'free' | 'pro' | 'business'
          subscription_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          max_properties: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin' | 'superadmin'
          subscription_plan?: 'free' | 'pro' | 'business'
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          max_properties?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      properties: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'house' | 'apartment' | 'office' | 'store' | 'other'
          unit_number: string | null
          address: string | null
          photo_url: string | null
          qr_code: string
          qr_color: string
          qr_bg_color: string
          status: 'available' | 'busy' | 'sleeping' | 'do_not_disturb' | 'away'
          is_building_mode: boolean
          phone_number: string | null
          notification_email: boolean
          notification_push: boolean
          notification_sound: boolean
          cooldown_seconds: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'house' | 'apartment' | 'office' | 'store' | 'other'
          unit_number?: string | null
          address?: string | null
          photo_url?: string | null
          qr_code?: string
          qr_color?: string
          qr_bg_color?: string
          status?: 'available' | 'busy' | 'sleeping' | 'do_not_disturb' | 'away'
          is_building_mode?: boolean
          phone_number?: string | null
          notification_email?: boolean
          notification_push?: boolean
          notification_sound?: boolean
          cooldown_seconds?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      ring_events: {
        Row: {
          id: string
          property_id: string
          visitor_category: 'delivery' | 'guest' | 'mail' | 'emergency' | 'other'
          visitor_message: string | null
          visitor_ip: string | null
          status: 'pending' | 'seen' | 'responded' | 'ignored'
          quick_response: string | null
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          visitor_category?: 'delivery' | 'guest' | 'mail' | 'emergency' | 'other'
          visitor_message?: string | null
          visitor_ip?: string | null
          status?: 'pending' | 'seen' | 'responded' | 'ignored'
          quick_response?: string | null
          responded_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ring_events']['Insert']>
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          fcm_token: string | null
          device_name: string | null
          browser: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          fcm_token?: string | null
          device_name?: string | null
          browser?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'ring' | 'system' | 'subscription' | 'promo'
          title: string
          body: string
          data: Json | null
          is_read: boolean
          ring_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'ring' | 'system' | 'subscription' | 'promo'
          title: string
          body: string
          data?: Json | null
          is_read?: boolean
          ring_event_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      quick_responses: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          text: string
          is_default: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          text: string
          is_default?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['quick_responses']['Insert']>
      }
      building_units: {
        Row: {
          id: string
          property_id: string
          unit_name: string
          unit_number: string
          resident_name: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_name: string
          unit_number: string
          resident_name?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['building_units']['Insert']>
      }
      intercom_sessions: {
        Row: {
          id: string
          property_id: string
          ring_event_id: string
          webrtc_offer: string | null
          webrtc_answer: string | null
          status: 'pending' | 'active' | 'ended'
          started_at: string | null
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          ring_event_id: string
          webrtc_offer?: string | null
          webrtc_answer?: string | null
          status?: 'pending' | 'active' | 'ended'
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['intercom_sessions']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_summary: {
        Args: { p_user_id: string; p_property_id?: string }
        Returns: {
          total_rings: number
          rings_today: number
          rings_this_week: number
          rings_this_month: number
          average_response_time: number | null
          most_active_hour: number | null
          top_category: string | null
        }[]
      }
      get_rings_by_hour: {
        Args: { p_property_id: string; p_days?: number }
        Returns: { hour: number; count: number }[]
      }
      get_rings_by_day: {
        Args: { p_property_id: string; p_days?: number }
        Returns: { date: string; count: number }[]
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'superadmin'
      subscription_plan: 'free' | 'pro' | 'business'
      property_type: 'house' | 'apartment' | 'office' | 'store' | 'other'
      property_status: 'available' | 'busy' | 'sleeping' | 'do_not_disturb' | 'away'
      visitor_category: 'delivery' | 'guest' | 'mail' | 'emergency' | 'other'
      ring_status: 'pending' | 'seen' | 'responded' | 'ignored'
      notification_type: 'ring' | 'system' | 'subscription' | 'promo'
    }
  }
}
