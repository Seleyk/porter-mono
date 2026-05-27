import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useBookingStore } from "@/store/bookingStore";
import { markOrderCollected } from "@/services/porterBox";

const STEPS = [
  { icon: "location-outline" as const, text: "Go to your Porter Box location" },
  { icon: "keypad-outline" as const, text: "Enter your code on the locker keypad" },
  { icon: "cube-outline" as const, text: "Collect your items and enjoy" },
];

export default function PorterBoxPickupScreen() {
  const insets = useSafeAreaInsets();
  const { porterBoxOrderId, porterBoxCode, porterBoxChargeCents, selectedBoxName } = useBookingStore();

  const displayCode = porterBoxCode
    ? porterBoxCode.split("").join(" ")
    : "— — — —";

  const chargeDisplay = porterBoxChargeCents
    ? `$${(porterBoxChargeCents / 100).toFixed(2)}`
    : "$8.00";

  async function handleCollected() {
    if (porterBoxOrderId) {
      const { error } = await markOrderCollected(porterBoxOrderId);
      if (error) {
        Alert.alert("Error", "Could not mark order as collected. Please try again.");
        return;
      }
    }
    router.replace("/porter-box-collected");
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
          <Text style={styles.titleText}>Pickup Code</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Locker art */}
        <View style={styles.lockerArt}>
          <View style={styles.lockerBody}>
            <View style={styles.lockerRow}>
              {[0, 1].map((i) => (
                <View key={i} style={styles.lockerDoor}>
                  <View style={styles.lockerHandle} />
                </View>
              ))}
            </View>
            <View style={styles.lockerRow}>
              {[0, 1].map((i) => (
                <View key={i} style={[styles.lockerDoor, i === 0 && styles.lockerDoorActive]}>
                  <View style={[styles.lockerHandle, i === 0 && styles.lockerHandleActive]} />
                  {i === 0 && (
                    <View style={styles.lockerActiveIndicator}>
                      <View style={styles.lockerActiveDot} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
          <View style={styles.storagePill}>
            <Ionicons name="cube-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.storagePillText}>
              {selectedBoxName ?? "Porter Box"} · {chargeDisplay}
            </Text>
          </View>
        </View>

        {/* Code display */}
        <Text style={styles.codeLabel}>YOUR PICKUP CODE</Text>
        <Text style={styles.code}>{displayCode}</Text>
        <Text style={styles.codeSub}>Enter this code at the locker keypad</Text>

        {/* Steps */}
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons name={s.icon} size={16} color={Colors.steel} />
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={handleCollected}
        >
          <Text style={styles.ctaText}>I've Collected My Items</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
  lockerArt: {
    alignItems: "center",
    marginBottom: 28,
    gap: 14,
  },
  lockerBody: {
    backgroundColor: "rgba(20,46,80,0.7)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    padding: 12,
    gap: 8,
  },
  lockerRow: {
    flexDirection: "row",
    gap: 8,
  },
  lockerDoor: {
    width: 70,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lockerDoorActive: {
    backgroundColor: "rgba(229,201,122,0.08)",
    borderColor: "rgba(229,201,122,0.35)",
  },
  lockerHandle: {
    width: 6,
    height: 20,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  lockerHandleActive: {
    backgroundColor: Colors.gold,
  },
  lockerActiveIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  lockerActiveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.gold,
  },
  storagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  storagePillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  codeLabel: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 12,
  },
  code: {
    fontSize: 54,
    fontFamily: Fonts.serif,
    color: "#fff",
    textAlign: "center",
    letterSpacing: 12,
    marginBottom: 8,
  },
  codeSub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  steps: {
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
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
    marginTop: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
