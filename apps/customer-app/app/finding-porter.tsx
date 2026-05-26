import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Animated, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useBookingStore } from "@/store/bookingStore";
import { createBooking } from "@/services/booking";

const STEPS = [
  "Verifying porter credentials…",
  "Calculating optimal route…",
  "Confirming availability…",
  "Porter confirmed.",
];

export default function FindingPorterScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const store = useBookingStore();
  const pulse = useRef(new Animated.Value(1)).current;
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const bookingCreated = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); return 100; }
        return Math.min(100, p + 1.4);
      });
    }, 50);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const idx = Math.min(STEPS.length - 1, Math.floor(progress / 25));
    setStepIdx(idx);
  }, [progress]);

  useEffect(() => {
    if (progress >= 100 && !bookingCreated.current && user && store.itemType) {
      bookingCreated.current = true;
      createBooking({
        customerId: user.id,
        pickup: store.pickup,
        dropoff: store.dropoff,
        itemType: store.itemType,
        itemCounts: store.itemCounts,
        specialRequests: store.specialRequests,
        dropoffMethod: store.dropoffMethod,
        selectedBoxName: store.selectedBoxName,
        deliverySpeed: store.deliverySpeed,
      })
        .then((booking) => store.setBookingId(booking.id))
        .catch(console.error);
      const t = setTimeout(() => router.replace("/tracking"), 600);
      return () => clearTimeout(t);
    }
  }, [progress]);

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
        {/* Cancel */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancel</Text>
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

        <Text style={styles.heading}>Finding your{"\n"}<Text style={styles.headingItalic}>porter.</Text></Text>
        <Text style={styles.step}>{STEPS[stepIdx]}</Text>

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
            <Text style={styles.idTitle}>Identity-verified porters</Text>
            <Text style={styles.idDesc}>Every porter is background-checked and trained before their first delivery.</Text>
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
