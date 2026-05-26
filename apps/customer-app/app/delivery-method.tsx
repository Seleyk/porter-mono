import { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore, DELIVERY_OPTIONS, type DeliverySpeed } from "@/store/bookingStore";

const METHODS = [
  {
    id: "priority",
    icon: "flash-outline" as const,
    label: "Priority",
    eta: "15–25 min",
    price: "$28",
    desc: "Next available porter, dispatched immediately.",
  },
  {
    id: "standard",
    icon: "bicycle-outline" as const,
    label: "Standard",
    eta: "35–55 min",
    price: "$18",
    desc: "Efficient delivery at a relaxed pace.",
  },
  {
    id: "scheduled",
    icon: "calendar-outline" as const,
    label: "Scheduled",
    eta: "Choose time",
    price: "From $16",
    desc: "Book a porter for later today or any future date.",
  },
];

const PORTERS = [
  { initials: "JR", x: "22%", y: "48%" },
  { initials: "MA", x: "65%", y: "22%" },
  { initials: "EH", x: "12%", y: "64%" },
  { initials: "TK", x: "43%", y: "70%" },
  { initials: "LO", x: "75%", y: "58%" },
];

export default function DeliveryMethodScreen() {
  const insets = useSafeAreaInsets();
  const { deliverySpeed, setDeliverySpeed } = useBookingStore();
  const [method, setMethod] = useState<DeliverySpeed>(deliverySpeed);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const selected = DELIVERY_OPTIONS[method];

  useEffect(() => { initializePaymentSheet(); }, [method]);

  async function initializePaymentSheet() {
    setPaymentReady(false);
    setPaymentLoading(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: selected.price * 100 }),
        }
      );
      const { clientSecret, error: fnError } = await res.json();
      if (fnError || !clientSecret) throw new Error(fnError ?? "No clientSecret");

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Porter",
        style: "alwaysDark",
        appearance: {
          colors: {
            primary: "#6FA3C8",
            background: "#050B16",
            componentBackground: "#0B2A4A",
            componentText: "#F4F6F8",
            placeholderText: "rgba(244,246,248,0.4)",
          },
        },
      });
      if (!error) setPaymentReady(true);
    } catch (e) {
      console.error("Payment init failed:", e);
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleConfirmAndBook() {
    if (!paymentReady) return;
    const { error } = await presentPaymentSheet();
    if (error) {
      if (error.code !== "Canceled") Alert.alert("Payment failed", error.message);
      return;
    }
    setDeliverySpeed(method);
    router.push("/finding-porter");
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
          <Text style={styles.stepLabel}>4 of 4</Text>
        </View>

        {/* Mini map */}
        <View style={styles.mapCard}>
          {[25, 50, 75].map((p) => (
            <View key={`h${p}`} style={[styles.gridLine, { top: `${p}%` as any, left: 0, right: 0, height: 1 }]} />
          ))}
          {[20, 40, 60, 80].map((p) => (
            <View key={`v${p}`} style={[styles.gridLine, { left: `${p}%` as any, top: 0, bottom: 0, width: 1 }]} />
          ))}
          {PORTERS.map((p) => (
            <View
              key={p.initials}
              style={[styles.porterBadge, { left: p.x as any, top: p.y as any, transform: [{ translateX: -14 }, { translateY: -14 }] }]}
            >
              <Text style={styles.porterInitials}>{p.initials}</Text>
            </View>
          ))}
          <View style={[styles.userDot, { left: "48%" as any, top: "50%" as any, transform: [{ translateX: -10 }, { translateY: -10 }] }]} />
          <View style={styles.mapPill}>
            <View style={styles.mapPillDot} />
            <Text style={styles.mapPillText}>5 porters nearby</Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.eyebrow}>Delivery Speed</Text>
        <Text style={styles.heading}>
          How soon do you{"\n"}
          <Text style={styles.headingItalic}>need it there?</Text>
        </Text>

        {/* Method options */}
        <View style={styles.methods}>
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.methodRow, active && styles.methodRowActive]}
                onPress={() => setMethod(m.id as DeliverySpeed)}
              >
                <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                  <Ionicons name={m.icon} size={18} color={active ? Colors.steel : Colors.textMuted} />
                </View>
                <View style={styles.methodBody}>
                  <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <View style={styles.methodRight}>
                  <Text style={[styles.methodPrice, active && styles.methodPriceActive]}>{m.price}</Text>
                  <Text style={styles.methodEta}>{m.eta}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Payment row */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.paymentText}>
              {paymentLoading ? "Loading payment…" : "Pay with card"}
            </Text>
          </View>
          <Text style={styles.paymentTotal}>${selected.price}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: paymentReady ? (pressed ? 0.85 : 1) : 0.5 }]}
          onPress={handleConfirmAndBook}
          disabled={!paymentReady || paymentLoading}
        >
          <Text style={styles.ctaText}>
            {paymentLoading ? "Preparing…" : "Confirm & Book"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
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
    marginBottom: 16,
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
  stepLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  mapCard: {
    height: 150,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  porterBadge: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.navy,
    borderWidth: 1.5,
    borderColor: Colors.steel,
    alignItems: "center",
    justifyContent: "center",
  },
  porterInitials: {
    fontSize: 9,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  userDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
    borderWidth: 3,
    borderColor: "rgba(229,201,122,0.3)",
  },
  mapPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(5,11,22,0.8)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapPillDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.steel,
  },
  mapPillText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heading: {
    fontSize: 30,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  methods: {
    gap: 10,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  methodRowActive: {
    backgroundColor: "rgba(111,163,200,0.08)",
    borderColor: "rgba(111,163,200,0.35)",
  },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  methodIconActive: {
    backgroundColor: "rgba(111,163,200,0.1)",
    borderColor: "rgba(111,163,200,0.2)",
  },
  methodBody: {
    flex: 1,
    gap: 2,
  },
  methodLabel: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  methodLabelActive: {
    color: "#fff",
  },
  methodDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    lineHeight: 16,
  },
  methodRight: {
    alignItems: "flex-end",
    gap: 2,
    flexShrink: 0,
  },
  methodPrice: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  methodPriceActive: {
    color: "#fff",
  },
  methodEta: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  paymentTotal: {
    fontSize: 18,
    fontFamily: Fonts.semibold,
    color: "#fff",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
