import { create } from "zustand";

export type ItemType = "luggage" | "shopping" | "parcels" | "other";
export type DropoffMethod = "door" | "box";
export type DeliverySpeed = "priority" | "standard" | "scheduled";

interface ItemCounts {
  large: number;
  standard: number;
  small: number;
}

interface BookingState {
  // Step 1 — route
  pickup: string;
  dropoff: string;

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

  // Actions
  setRoute: (pickup: string, dropoff: string) => void;
  setItemType: (type: ItemType) => void;
  setItemCounts: (counts: ItemCounts) => void;
  setSpecialRequests: (text: string) => void;
  setDropoffMethod: (method: DropoffMethod) => void;
  setSelectedBox: (id: string, name: string) => void;
  setDeliverySpeed: (speed: DeliverySpeed) => void;
  reset: () => void;
}

const DEFAULT_COUNTS: ItemCounts = { large: 0, standard: 1, small: 0 };

const initialState = {
  pickup: "",
  dropoff: "",
  itemType: null,
  itemCounts: DEFAULT_COUNTS,
  specialRequests: "",
  dropoffMethod: "door" as DropoffMethod,
  selectedBoxId: null,
  selectedBoxName: null,
  deliverySpeed: "priority" as DeliverySpeed,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setRoute: (pickup, dropoff) => set({ pickup, dropoff }),
  setItemType: (itemType) => set({ itemType }),
  setItemCounts: (itemCounts) => set({ itemCounts }),
  setSpecialRequests: (specialRequests) => set({ specialRequests }),
  setDropoffMethod: (dropoffMethod) =>
    set({ dropoffMethod, selectedBoxId: null, selectedBoxName: null }),
  setSelectedBox: (selectedBoxId, selectedBoxName) =>
    set({ selectedBoxId, selectedBoxName }),
  setDeliverySpeed: (deliverySpeed) => set({ deliverySpeed }),
  reset: () => set(initialState),
}));

// Derived helpers
export const DELIVERY_OPTIONS = {
  priority: { label: "Priority", eta: "15–25 min", price: 28 },
  standard: { label: "Standard", eta: "35–55 min", price: 18 },
  scheduled: { label: "Scheduled", eta: "Choose time", price: 16 },
} as const;
