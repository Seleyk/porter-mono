import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useBookingStore } from "@/store/bookingStore";

export default function PorterBoxCollectedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { porterBoxChargeCents, selectedBoxName, reset } = useBookingStore();

  const firstName = profile?.first_name ?? "there";
  const chargeAmount = porterBoxChargeCents ? porterBoxChargeCents / 100 : 8;
  const serviceFee = 2.0;
  const total = chargeAmount + serviceFee;

  const CHARGE = [
    { label: "Porter Box storage", value: `$${chargeAmount.toFixed(2)}` },
    { label: "Service fee", value: `$${serviceFee.toFixed(2)}` },
  ];

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }]}>
        <View style={{ flex: 1 }} />

        {/* Checkmark */}
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={40} color={Colors.evergreen} />
          </View>
        </View>

        {/* Heading */}
        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>All Done</Text>
          <Text style={styles.heading}>
            Safe travels,{"\n"}
            <Text style={styles.headingItalic}>{firstName}.</Text>
          </Text>
          <Text style={styles.sub}>
            Your items were stored safely at {selectedBoxName ?? "Porter Box"}.
          </Text>
        </View>

        {/* Charge summary */}
        <View style={styles.chargeCard}>
          <Text style={styles.chargeTitle}>Storage Summary</Text>
          {CHARGE.map((c) => (
            <View key={c.label} style={styles.chargeRow}>
              <Text style={styles.chargeLabel}>{c.label}</Text>
              <Text style={styles.chargeValue}>{c.value}</Text>
            </View>
          ))}
          <View style={styles.chargeDivider} />
          <View style={styles.chargeRow}>
            <Text style={styles.chargeTotal}>Total charged</Text>
            <Text style={styles.chargeTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { reset(); router.replace("/(tabs)"); }}
          >
            <Text style={styles.ctaText}>Back to Home</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => { reset(); router.push("/porter-box-hub"); }}
          >
            <Text style={styles.secondaryBtnText}>Use Porter Box Again</Text>
          </Pressable>
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
  checkWrap: {
    marginBottom: 28,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(78,111,100,0.15)",
    borderWidth: 1,
    borderColor: "rgba(78,111,100,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 40,
    fontFamily: Fonts.serif,
    color: "#fff",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -0.3,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  sub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  chargeCard: {
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    padding: 20,
    gap: 10,
    width: "100%",
  },
  chargeTitle: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  chargeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  chargeValue: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  chargeDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  chargeTotal: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  chargeTotalValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
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
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
});
