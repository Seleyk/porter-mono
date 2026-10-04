import type { Tables } from "./database.types";

// Row shortcuts for the tables both apps use.
export type Profile = Tables<"profiles">;
export type ServiceRequest = Tables<"service_requests">;
export type DeliveryTracking = Tables<"delivery_tracking">;
export type PorterLocation = Tables<"porter_locations">;
export type PorterHub = Tables<"porter_hubs">;
export type PorterBoxOrder = Tables<"porter_box_orders">;
export type Message = Tables<"messages">;
export type Rating = Tables<"ratings">;

// The columns below are plain `text` with a CHECK constraint, so the generator
// types them as `string`. These lists mirror the constraints in
// supabase/migrations; keep them in sync when a migration changes one.
export const USER_TYPES = ["customer", "porter"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const REQUEST_SERVICE_TYPES = ["luggage", "shopping", "packages"] as const;
export type RequestServiceType = (typeof REQUEST_SERVICE_TYPES)[number];

export const ITEM_SIZES = ["small", "medium", "large"] as const;
export type ItemSize = (typeof ITEM_SIZES)[number];

export const REQUEST_STATUSES = ["pending", "matched", "accepted", "picked_up", "completed", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "processing", "completed", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TRACKING_STATUSES = ["porter_assigned", "en_route_pickup", "at_pickup", "en_route_delivery", "delivered"] as const;
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
