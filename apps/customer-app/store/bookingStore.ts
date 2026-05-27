import { create } from "zustand";

export type ItemType = "luggage" | "shopping" | "parcels" | "other";
export type DropoffMethod = "door" | "box";
export type DeliverySpeed = "priority" | "standard" | "scheduled";
export interface LatLng { lat: number; lng: number; }

interface ItemCounts {
  large: number;
  standard: number;
  small: number;
}

interface BookingState {
  // Step 1 — route
  pickup: string;
  dropoff: string;
  pickupCoords: LatLng | null;
  dropoffCoords: LatLng | null;

  // Step 2 — item type
  itemType: ItemType | null;

  // Step 3 — item details
  itemCounts: ItemCounts;
  specialRequests: string;

  // Step 4 — dropoff method
  dropoffMethod: DropoffMethod;
  selectedBoxId: string | null;
  selectedBoxName: string | null;

  // Step 5 — delivery speed
  deliverySpeed: DeliverySpeed;

  // Step 3 — declared item value (required for fare calculation)
  itemValueUSD: number | null;

  // Calculated fare for the selected speed tier
  calculatedFare: number | null;

  // Porter Box — storage duration selected by user
  storageDays: number;

  // Created booking
  bookingId: string | null;

  // Porter Box order
  porterBoxOrderId: string | null;
  porterBoxCode: string | null;
  porterBoxChargeCents: number | null;

  // Actions
  setRoute: (pickup: string, dropoff: string, pickupCoords?: LatLng | null, dropoffCoords?: LatLng | null) => void;
  setItemType: (type: ItemType) => void;
  setItemCounts: (counts: ItemCounts) => void;
  setSpecialRequests: (text: string) => void;
  setDropoffMethod: (method: DropoffMethod) => void;
  setSelectedBox: (id: string, name: string) => void;
  setDeliverySpeed: (speed: DeliverySpeed) => void;
  setItemValueUSD: (v: number) => void;
  setCalculatedFare: (v: number) => void;
  setStorageDays: (days: number) => void;
  setBookingId: (id: string) => void;
  setPorterBoxOrder: (orderId: string, code: string, chargeCents: number) => void;
  reset: () => void;
}

const DEFAULT_COUNTS: ItemCounts = { large: 0, standard: 1, small: 0 };

const initialState = {
  pickup: "",
  dropoff: "",
  pickupCoords: null as LatLng | null,
  dropoffCoords: null as LatLng | null,
  itemType: null,
  itemCounts: DEFAULT_COUNTS,
  specialRequests: "",
  dropoffMethod: "door" as DropoffMethod,
  selectedBoxId: null,
  selectedBoxName: null,
  deliverySpeed: "priority" as DeliverySpeed,
  itemValueUSD: null,
  calculatedFare: null,
  storageDays: 1,
  bookingId: null,
  porterBoxOrderId: null,
  porterBoxCode: null,
  porterBoxChargeCents: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setRoute: (pickup, dropoff, pickupCoords = null, dropoffCoords = null) =>
    set({ pickup, dropoff, pickupCoords, dropoffCoords }),
  setItemType: (itemType) => set({ itemType }),
  setItemCounts: (itemCounts) => set({ itemCounts }),
  setSpecialRequests: (specialRequests) => set({ specialRequests }),
  setDropoffMethod: (dropoffMethod) =>
    set({ dropoffMethod, selectedBoxId: null, selectedBoxName: null }),
  setSelectedBox: (selectedBoxId, selectedBoxName) =>
    set({ selectedBoxId, selectedBoxName }),
  setDeliverySpeed: (deliverySpeed) => set({ deliverySpeed }),
  setItemValueUSD: (itemValueUSD) => set({ itemValueUSD }),
  setCalculatedFare: (calculatedFare) => set({ calculatedFare }),
  setStorageDays: (storageDays) => set({ storageDays }),
  setBookingId: (bookingId) => set({ bookingId }),
  setPorterBoxOrder: (porterBoxOrderId, porterBoxCode, porterBoxChargeCents) =>
    set({ porterBoxOrderId, porterBoxCode, porterBoxChargeCents }),
  reset: () => set(initialState),
}));

// Derived helpers
export const DELIVERY_OPTIONS = {
  priority: { label: "Priority", eta: "15–25 min", price: 28 },
  standard: { label: "Standard", eta: "35–55 min", price: 18 },
  scheduled: { label: "Scheduled", eta: "Choose time", price: 16 },
} as const;
