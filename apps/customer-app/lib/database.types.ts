export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── profiles ────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  user_type: "customer" | "porter";
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string | null;
  verification_status: "pending" | "approved" | "rejected";
  stripe_customer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileInsert = {
  id: string;
  user_type?: "customer" | "porter";
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified?: boolean;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  license_plate?: string | null;
  verification_status?: "pending" | "approved" | "rejected";
  stripe_customer_id?: string | null;
  is_active?: boolean;
};

type ProfileUpdate = {
  user_type?: "customer" | "porter";
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
  email_verified?: boolean;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  license_plate?: string | null;
  verification_status?: "pending" | "approved" | "rejected";
  stripe_customer_id?: string | null;
  is_active?: boolean;
};

// ─── service_requests ────────────────────────────────────────────────────────

type ServiceRequestRow = {
  id: string;
  customer_id: string;
  porter_id: string | null;
  service_type: "luggage" | "shopping" | "packages";
  item_count: number;
  item_size: "small" | "medium" | "large";
  special_instructions: string | null;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_pickup_time: string | null;
  estimated_dropoff_time: string | null;
  actual_pickup_time: string | null;
  actual_dropoff_time: string | null;
  status: "pending" | "matched" | "accepted" | "picked_up" | "completed" | "cancelled";
  base_price: number | null;
  tip_amount: number;
  total_price: number | null;
  payment_status: "pending" | "processing" | "completed" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
};

type ServiceRequestInsert = {
  customer_id: string;
  service_type: "luggage" | "shopping" | "packages";
  item_count?: number;
  item_size?: "small" | "medium" | "large";
  special_instructions?: string | null;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_pickup_time?: string | null;
  estimated_dropoff_time?: string | null;
  status?: string;
  base_price?: number | null;
  tip_amount?: number;
  total_price?: number | null;
};

type ServiceRequestUpdate = {
  porter_id?: string | null;
  status?: string;
  item_count?: number;
  item_size?: "small" | "medium" | "large";
  special_instructions?: string | null;
  estimated_pickup_time?: string | null;
  estimated_dropoff_time?: string | null;
  actual_pickup_time?: string | null;
  actual_dropoff_time?: string | null;
  base_price?: number | null;
  tip_amount?: number;
  total_price?: number | null;
  payment_status?: string;
};

// ─── delivery_tracking ────────────────────────────────────────────────────────

type DeliveryTrackingRow = {
  id: string;
  service_request_id: string;
  porter_id: string;
  status: "porter_assigned" | "en_route_pickup" | "at_pickup" | "en_route_delivery" | "delivered";
  current_location: unknown;
  estimated_arrival: string | null;
  created_at: string;
  updated_at: string;
};

type DeliveryTrackingInsert = {
  service_request_id: string;
  porter_id: string;
  status: string;
  current_location?: unknown;
  estimated_arrival?: string | null;
};

type DeliveryTrackingUpdate = {
  status?: string;
  current_location?: unknown;
  estimated_arrival?: string | null;
};

// ─── porter_locations ─────────────────────────────────────────────────────────

type PorterLocationRow = {
  id: string;
  porter_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  is_online: boolean;
  updated_at: string;
};

type PorterLocationInsert = {
  porter_id: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  is_online?: boolean;
};

type PorterLocationUpdate = {
  latitude?: number;
  longitude?: number;
  heading?: number | null;
  is_online?: boolean;
};

// ─── porter_hubs ─────────────────────────────────────────────────────────────

type PorterHubRow = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  operating_hours: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
};

type PorterHubInsert = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  operating_hours?: string;
  capacity?: number;
  is_active?: boolean;
};

type PorterHubUpdate = {
  name?: string;
  address?: string;
  operating_hours?: string;
  capacity?: number;
  is_active?: boolean;
};

// ─── messages ─────────────────────────────────────────────────────────────────

type MessageRow = {
  id: string;
  request_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type MessageInsert = {
  request_id: string;
  sender_id: string;
  message: string;
};

// ─── ratings ──────────────────────────────────────────────────────────────────

type RatingRow = {
  id: string;
  request_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type RatingInsert = {
  request_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment?: string | null;
};

// ─── Database type ────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      service_requests: {
        Row: ServiceRequestRow;
        Insert: ServiceRequestInsert;
        Update: ServiceRequestUpdate;
        Relationships: [];
      };
      delivery_tracking: {
        Row: DeliveryTrackingRow;
        Insert: DeliveryTrackingInsert;
        Update: DeliveryTrackingUpdate;
        Relationships: [];
      };
      porter_locations: {
        Row: PorterLocationRow;
        Insert: PorterLocationInsert;
        Update: PorterLocationUpdate;
        Relationships: [];
      };
      porter_hubs: {
        Row: PorterHubRow;
        Insert: PorterHubInsert;
        Update: PorterHubUpdate;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: MessageInsert;
        Update: { [_ in never]: never };
        Relationships: [];
      };
      ratings: {
        Row: RatingRow;
        Insert: RatingInsert;
        Update: { [_ in never]: never };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// ─── Convenience exports ──────────────────────────────────────────────────────

export type Profile = ProfileRow;
export type ServiceRequest = ServiceRequestRow;
export type DeliveryTracking = DeliveryTrackingRow;
export type PorterLocation = PorterLocationRow;
export type PorterHub = PorterHubRow;
export type Message = MessageRow;
export type Rating = RatingRow;
