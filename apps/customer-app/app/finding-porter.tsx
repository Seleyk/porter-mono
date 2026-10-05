import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useBookingStore } from "@/store/bookingStore";
import { cancelBooking, createBooking } from "@/services/booking";
import { useLiveBooking } from "@/hooks/useLiveBooking";

const STEPS = [
  "Sending your request to porters nearby…",
  "Waiting for a porter to accept…",
  "Porters are reviewing your request…",
];

export default function FindingPorterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, bgGradient } = useColors();
  const { user } = useAuth();
  const store = useBookingStore();
  const pulse = useRef(new Animated.Value(1)).current;
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const bookingCreated = useRef(false);
  const { booking, porter } = useLiveBooking(store.bookingId);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  // Indeterminate progress: sweeps until a porter accepts.
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 1)), 50);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStepIdx((i) => (i + 1) % STEPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Place the booking once. It goes to the job board for nearby porters.
  useEffect(() => {
    if (bookingCreated.current || store.bookingId || !user || !store.itemType) return;
    bookingCreated.current = true;
    if (store.dropoffMethod === "box") {
      store.setPorterBoxCode(String(Math.floor(1000 + Math.random() * 9000)));
    }
    createBooking({
      customerId: user.id,
      pickup: store.pickup,
      dropoff: store.dropoff,
      pickupCoords: store.pickupCoords,
      dropoffCoords: store.dropoffCoords,
      itemType: store.itemType,
      itemCounts: store.itemCounts,
      specialRequests: store.specialRequests,
      dropoffMethod: store.dropoffMethod,
      selectedBoxName: store.selectedBoxName,
      deliverySpeed: store.deliverySpeed,
      fareUSD: store.calculatedFare ?? 0,
    })
      .then((b) => store.setBookingId(b.id))
      .catch((e) => {
        Alert.alert("Couldn't place your booking", e.message ?? "Please try again.");
        router.back();
      });
  }, [user]);

  // A porter accepted: show them and move to live tracking.
  useEffect(() => {
    if (!booking) return;
    if (booking.status === "cancelled") {
      store.reset();
      router.replace("/(tabs)");
      return;
    }
    if (booking.porter_id && porter && (booking.status === "accepted" || booking.status === "picked_up")) {
      const initials = `${porter.first_name[0] ?? ""}${porter.last_name[0] ?? ""}`.toUpperCase();
      store.setAssignedDriver(`${porter.first_name} ${porter.last_name[0] ?? ""}.`.trim(), initials, 0);
      router.replace("/tracking");
    }
  }, [booking?.status, booking?.porter_id, porter?.id]);

  const handleCancel = () => {
    if (!store.bookingId) {
      router.back();
      return;
    }
    Alert.alert("Cancel this booking?", "We'll stop looking for a porter.", [
      { text: "Keep looking", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(store.bookingId!);
            store.reset();
            router.replace("/(tabs)");
          } catch (e: any) {
            Alert.alert("Couldn't cancel", e.message ?? "Please try again.");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={[...bgGradient]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
        {/* Cancel */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={handleCancel} disabled={cancelling}>
            <Text style={[styles.cancel, { color: colors.textMuted }]}>{cancelling ? "Cancelling…" : "Cancel"}</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* Pulse logo */}
        <View style={styles.pulseWrap}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }], opacity: 0.15 }]} />
          <Animated.View style={[styles.pulseRing2, { transform: [{ scale: pulse }], opacity: 0.07 }]} />
          <View style={styles.logoCircle}>
            <Ionicons name="briefcase-outline" size={36} color={Colors.steel} />
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Finding your{"\n"}<Text style={styles.headingItalic}>porter.</Text></Text>
        <Text style={[styles.step, { color: colors.textMuted }]}>{STEPS[stepIdx]}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <View style={{ flex: 1 }} />

        {/* Identity card */}
        <View style={styles.idCard}>
          <View style={styles.idIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.steel} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.idTitle, { color: colors.text }]}>Identity-verified porters</Text>
            <Text style={[styles.idDesc, { color: colors.textMuted }]}>Every porter is background-checked and trained before their first delivery.</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 0,
  },
  cancel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  pulseWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.steel,
  },
  pulseRing2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.steel,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(20,46,80,0.9)",
    borderWidth: 1,
    borderColor: "rgba(111,163,200,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 36,
    fontFamily: Fonts.serif,
    color: "#fff",
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  step: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  progressTrack: {
    width: 180,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.steel,
    borderRadius: 999,
  },
  idCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    width: "100%",
  },
  idIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  idTitle: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  idDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
