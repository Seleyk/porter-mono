// GENERATED from the hosted Supabase project. Do not edit by hand.
// Regenerate after every migration: `npm run gen:types` at the repo root.

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
      delivery_tracking: {
        Row: {
          created_at: string | null
          current_location: unknown
          estimated_arrival: string | null
          id: string
          porter_id: string | null
          service_request_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_location?: unknown
          estimated_arrival?: string | null
          id?: string
          porter_id?: string | null
          service_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_location?: unknown
          estimated_arrival?: string | null
          id?: string
          porter_id?: string | null
          service_request_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_porter_id_fkey"
            columns: ["porter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      porter_box_orders: {
        Row: {
          charge_cents: number
          collected_at: string | null
          customer_id: string
          dropped_at: string
          hub_id: string
          id: string
          is_collected: boolean
          payment_status: string
          pickup_code: string
        }
        Insert: {
          charge_cents?: number
          collected_at?: string | null
          customer_id: string
          dropped_at?: string
          hub_id: string
          id?: string
          is_collected?: boolean
          payment_status?: string
          pickup_code: string
        }
        Update: {
          charge_cents?: number
          collected_at?: string | null
          customer_id?: string
          dropped_at?: string
          hub_id?: string
          id?: string
          is_collected?: boolean
          payment_status?: string
          pickup_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "porter_box_orders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "porter_hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      porter_hubs: {
        Row: {
          address: string
          capacity: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours: string | null
        }
        Insert: {
          address: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours?: string | null
        }
        Update: {
          address?: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          operating_hours?: string | null
        }
        Relationships: []
      }
      porter_locations: {
        Row: {
          heading: number | null
          id: string
          is_online: boolean | null
          latitude: number
          longitude: number
          porter_id: string
          updated_at: string | null
        }
        Insert: {
          heading?: number | null
          id?: string
          is_online?: boolean | null
          latitude: number
          longitude: number
          porter_id: string
          updated_at?: string | null
        }
        Update: {
          heading?: number | null
          id?: string
          is_online?: boolean | null
          latitude?: number
          longitude?: number
          porter_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "porter_locations_porter_id_fkey"
            columns: ["porter_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email_verified: boolean | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          license_plate: string | null
          phone: string | null
          payouts_enabled: boolean
          stripe_customer_id: string | null
          stripe_account_id: string | null
          updated_at: string | null
          user_type: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          first_name: string
          id: string
          is_active?: boolean | null
          last_name: string
          license_plate?: string | null
          phone?: string | null
          payouts_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_type: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email_verified?: boolean | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          license_plate?: string | null
          phone?: string | null
          payouts_enabled?: boolean
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_type?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rated_id: string
          rater_id: string
          rating: number | null
          request_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id: string
          rater_id: string
          rating?: number | null
          request_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id?: string
          rater_id?: string
          rating?: number | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_rated_id_fkey"
            columns: ["rated_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          actual_dropoff_time?: string | null
          actual_pickup_time?: string | null
          base_price?: number | null
          created_at?: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time?: string | null
          estimated_pickup_time?: string | null
          id?: string
          item_count?: number | null
          item_size?: string | null
          payment_status?: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id?: string | null
          proof_photo_path?: string | null
          service_type: string
          special_instructions?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          tip_amount?: number | null
          payout_transfer_id?: string | null
          porter_payout?: number | null
          tip_payment_intent_id?: string | null
          tip_transfer_id?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_dropoff_time?: string | null
          actual_pickup_time?: string | null
          base_price?: number | null
          created_at?: string | null
          customer_id?: string
          dropoff_address?: string
          dropoff_latitude?: number
          dropoff_longitude?: number
          estimated_dropoff_time?: string | null
          estimated_pickup_time?: string | null
          id?: string
          item_count?: number | null
          item_size?: string | null
          payment_status?: string | null
          pickup_address?: string
          pickup_latitude?: number
          pickup_longitude?: number
          porter_id?: string | null
          proof_photo_path?: string | null
          service_type?: string
          special_instructions?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          tip_amount?: number | null
          payout_transfer_id?: string | null
          porter_payout?: number | null
          tip_payment_intent_id?: string | null
          tip_transfer_id?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_porter_id_fkey"
            columns: ["porter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_request: {
        Args: { request_id: string }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_tip: {
        Args: { amount: number; request_id: string }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      advance_request: {
        Args: { photo_path?: string; request_id: string; to_status: string }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_request: {
        Args: { request_id: string }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_api_role: { Args: never; Returns: boolean }
      is_approved_porter: { Args: { uid?: string }; Returns: boolean }
      nearby_open_requests: {
        Args: { lat: number; lng: number; radius_km?: number }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      release_request: {
        Args: { request_id: string }
        Returns: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          base_price: number | null
          created_at: string | null
          customer_id: string
          dropoff_address: string
          dropoff_latitude: number
          dropoff_longitude: number
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          id: string
          item_count: number | null
          item_size: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number
          pickup_longitude: number
          porter_id: string | null
          proof_photo_path: string | null
          service_type: string
          special_instructions: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          tip_amount: number | null
          payout_transfer_id: string | null
          porter_payout: number | null
          tip_payment_intent_id: string | null
          tip_transfer_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "service_requests"
          isOneToOne: true
          isSetofReturn: false
        }
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
    Enums: {},
  },
} as const
