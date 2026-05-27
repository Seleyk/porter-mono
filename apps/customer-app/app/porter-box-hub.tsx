import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useStripe } from "@stripe/stripe-react-native";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { PorterHub } from "@/lib/database.types";
import { useBookingStore } from "@/store/bookingStore";
import { fetchActivePorterBoxOrders, formatDuration, type PorterBoxOrder } from "@/services/porterBox";
import { getBoxStorageFare } from "@/services/porterFare";

const HOW_TO = [
  { step: "1", text: "Select a nearby Porter Box location." },
  { step: "2", text: "A porter delivers your items and locks them in." },
  { step: "3", text: "You receive a unique pickup code via SMS." },
  { step: "4", text: "Retrieve your items at any time — no rush." },
];

export default function PorterBoxHubScreen() {
  const insets = useSafeAreaInsets();
  const store = useBookingStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [tab, setTab] = useState<"pickup" | "dropoff">("pickup");
  const [hubs, setHubs] = useState<PorterHub[]>([]);
  const [hubsLoading, setHubsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<PorterBoxOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [pendingHub, setPendingHub] = useState<PorterHub | null>(null);
  const [days, setDays] = useState(store.storageDays);

  useEffect(() => {
    supabase
      .from("porter_hubs")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => setHubs(data ?? []))
      .finally(() => setHubsLoading(false));

    fetchActivePorterBoxOrders()
      .then(setActiveOrders)
      .finally(() => setOrdersLoading(false));
  }, []);

  async function handleDropOff(hub: PorterHub, storageDays: number) {
    const fareResult = getBoxStorageFare(storageDays);
    if (!fareResult.success) return;
    const amountCents = Math.round(fareResult.fare.totalFareUSD * 100);
    store.setStorageDays(storageDays);
    setPaymentLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-porter-box-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ hubId: hub.id, amount: amountCents }),
        }
      );
      const { clientSecret, orderId, pickupCode, error: fnError } = await res.json();
      if (fnError || !clientSecret) throw new Error(fnError ?? "No clientSecret");

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Porter",
        returnURL: "porter://stripe-redirect",
        style: "alwaysDark",
        applePay: { merchantCountryCode: "US" },
        appearance: {
          colors: {
            primary: "#6FA3C8",
            background: "#050B16",
            componentBackground: "#0B2A4A",
            componentText: "#F4F6F8",
            placeholderText: "#F4F6F866",
          },
        },
      });
      if (initError) throw new Error(initError.message);

      setPaymentLoading(false);
      const { error: payError } = await presentPaymentSheet();
      if (payError) {
        if (payError.code !== "Canceled") Alert.alert("Payment failed", payError.message);
        return;
      }

      store.setPorterBoxOrder(orderId, pickupCode, amountCents);
      store.setSelectedBox(hub.id, hub.name);
      router.push("/porter-box-pickup");
    } catch (e) {
      setPaymentLoading(false);
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong");
    }
  }

  function handleViewPickup(order: PorterBoxOrder) {
    store.setPorterBoxOrder(order.id, order.pickup_code, order.charge_cents);
    store.setSelectedBox(order.hub_id, order.porter_hubs?.name ?? "Porter Box");
    router.push("/porter-box-pickup");
  }

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>
          <Text style={styles.titleText}>Porter Box</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Segmented control */}
        <View style={styles.segmented}>
          <Pressable
            style={[styles.segBtn, tab === "pickup" && styles.segBtnActive]}
            onPress={() => setTab("pickup")}
          >
            <Text style={[styles.segText, tab === "pickup" && styles.segTextActive]}>Pick Up</Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, tab === "dropoff" && styles.segBtnActive]}
            onPress={() => setTab("dropoff")}
          >
            <Text style={[styles.segText, tab === "dropoff" && styles.segTextActive]}>Drop Off</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
          {tab === "pickup" ? (
            <>
              {ordersLoading ? (
                <ActivityIndicator color={Colors.steel} style={{ marginTop: 24 }} />
              ) : activeOrders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Ionicons name="cube-outline" size={32} color={Colors.textDim} />
                  <Text style={styles.emptyOrdersTitle}>No active storage</Text>
                  <Text style={styles.emptyOrdersSub}>
                    Switch to Drop Off to store items at a nearby Porter Box.
                  </Text>
                </View>
              ) : (
                activeOrders.map((order) => (
                  <View key={order.id} style={styles.activeCard}>
                    <View style={styles.activeCardHeader}>
                      <View style={styles.activePill}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activePillText}>Ready for pickup</Text>
                      </View>
                      <Text style={styles.activeTimer}>{formatDuration(order.dropped_at)}</Text>
                    </View>
                    <Text style={styles.activeTitle}>Your items are waiting</Text>
                    <Text style={styles.activeSub}>
                      Porter Box · {order.porter_hubs?.name ?? "Hub"} · {order.porter_hubs?.address ?? ""}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.pickupBtn, { opacity: pressed ? 0.85 : 1 }]}
                      onPress={() => handleViewPickup(order)}
                    >
                      <Text style={styles.pickupBtnText}>Get Pickup Code</Text>
                      <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))
              )}

              {/* How to collect */}
              <Text style={styles.sectionLabel}>HOW TO COLLECT</Text>
              {HOW_TO.map((h) => (
                <View key={h.step} style={styles.howRow}>
                  <View style={styles.howNum}>
                    <Text style={styles.howNumText}>{h.step}</Text>
                  </View>
                  <Text style={styles.howText}>{h.text}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.eyebrow}>Nearby Locations</Text>
              {hubsLoading ? (
                <ActivityIndicator color={Colors.steel} style={{ marginTop: 20 }} />
              ) : hubs.length === 0 ? (
                <View style={styles.emptyHubs}>
                  <Ionicons name="cube-outline" size={28} color={Colors.textDim} />
                  <Text style={styles.emptyHubsText}>No porter boxes available in your area yet.</Text>
                </View>
              ) : (
                hubs.map((hub) => (
                  <Pressable
                    key={hub.id}
                    style={({ pressed }) => [styles.locationCard, { opacity: paymentLoading ? 0.5 : pressed ? 0.85 : 1 }]}
                    onPress={() => { if (!paymentLoading) { setPendingHub(hub); setDays(store.storageDays); setDurationModalVisible(true); } }}
                    disabled={paymentLoading}
                  >
                    <View style={styles.locationIconWrap}>
                      <Ionicons name="cube-outline" size={22} color={Colors.gold} />
                    </View>
                    <View style={styles.locationBody}>
                      <Text style={styles.locationName}>{hub.name}</Text>
                      <Text style={styles.locationAddr}>{hub.address}</Text>
                      <View style={styles.locationMeta}>
                        <Ionicons name="cube-outline" size={12} color={Colors.textDim} />
                        <Text style={styles.locationMetaText}>{hub.capacity} slots · $9.99/day</Text>
                      </View>
                    </View>
                    {paymentLoading ? (
                      <ActivityIndicator size="small" color={Colors.steel} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
                    )}
                  </Pressable>
                ))
              )}
            </>
          )}
        </ScrollView>

        {/* Duration picker modal */}
        <Modal
          visible={durationModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDurationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>How many days?</Text>
              <Text style={styles.modalSub}>$9.99 / day · pick up anytime, no rush</Text>

              <View style={styles.stepperRow}>
                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => setDays((d) => Math.max(1, d - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>{days}</Text>
                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => setDays((d) => Math.min(30, d + 1))}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </Pressable>
              </View>

              <Text style={styles.modalPrice}>${(9.99 * days).toFixed(2)}</Text>

              <Pressable
                style={({ pressed }) => [styles.modalCta, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => {
                  setDurationModalVisible(false);
                  if (pendingHub) handleDropOff(pendingHub, days);
                }}
              >
                <Text style={styles.modalCtaText}>Continue to Payment</Text>
              </Pressable>

              <Pressable onPress={() => setDurationModalVisible(false)} style={{ marginTop: 4 }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 4,
    marginBottom: 20,
  },
  segBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: {
    backgroundColor: Colors.midnight,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.3)",
  },
  segText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  segTextActive: {
    color: Colors.text,
  },
  activeCard: {
    backgroundColor: "rgba(229,201,122,0.06)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.25)",
    padding: 20,
    gap: 8,
  },
  activeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(229,201,122,0.12)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
  },
  activePillText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  activeTimer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  activeTitle: {
    fontSize: 20,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -0.2,
  },
  activeSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  pickupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.3)",
    marginTop: 4,
  },
  pickupBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  emptyOrders: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyOrdersTitle: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  emptyOrdersSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  howNum: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  howNumText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
  },
  howText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.15)",
    padding: 16,
  },
  locationIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: "rgba(229,201,122,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locationBody: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  locationAddr: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  locationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationMetaText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  emptyHubs: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  emptyHubsText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0B2A4A",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    padding: 28,
    paddingBottom: 44,
    alignItems: "center",
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -0.2,
  },
  modalSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    marginVertical: 8,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 40,
    fontFamily: Fonts.bold,
    color: "#fff",
    minWidth: 60,
    textAlign: "center",
  },
  modalPrice: {
    fontSize: 32,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: -0.5,
  },
  modalCta: {
    width: "100%",
    height: 54,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  modalCtaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.2,
  },
  modalCancel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
});
