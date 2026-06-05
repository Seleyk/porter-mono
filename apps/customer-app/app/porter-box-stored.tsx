import { StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useColors } from "@/context/ThemeContext";
import { useBookingStore } from "@/store/bookingStore";

export default function PorterBoxStoredScreen() {
  const insets = useSafeAreaInsets();
  const { colors, bgGradient } = useColors();
  const { porterBoxCode, selectedBoxName, reset } = useBookingStore();
  const codeDigits = (porterBoxCode ?? "0000").split("");

  return (
    <LinearGradient colors={[...bgGradient]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.eyebrow}>ITEMS STORED</Text>
        <Text style={[styles.heading, { color: colors.text }]}>
          Stored{"\n"}
          <Text style={styles.headingItalic}>safely.</Text>
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Your items are locked in at {selectedBoxName ?? "the Porter Box"}. Retrieve anytime using your pickup code below.
        </Text>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR PICKUP CODE</Text>
          <View style={styles.codeRow}>
            {codeDigits.map((d, i) => (
              <Text key={i} style={styles.codeDigit}>{d}</Text>
            ))}
          </View>
          <Text style={[styles.codeSub, { color: colors.textMuted }]}>Also saved under Services › Porter Box.</Text>
        </View>

        {/* How to collect */}
        <View style={styles.steps}>
          {[
            "Travel to the Porter Box location.",
            "Tap your code into the keypad on the locker face.",
            `Open your compartment and collect your items.`,
          ].map((text, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textMuted }]}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => { reset(); router.replace("/(tabs)"); }}
        >
          <Text style={styles.ctaText}>Done</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 40,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 48,
    letterSpacing: -0.3,
    marginTop: -8,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  sub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
    marginTop: -4,
  },
  codeCard: {
    backgroundColor: "rgba(10,20,35,0.85)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(229,201,122,0.25)",
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontFamily: Fonts.semibold,
    color: Colors.gold,
    letterSpacing: 3,
  },
  codeRow: {
    flexDirection: "row",
    gap: 16,
  },
  codeDigit: {
    fontSize: 52,
    fontFamily: Fonts.serif,
    color: "#fff",
    letterSpacing: -1,
  },
  codeSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: "center",
  },
  steps: {
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.steel,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  cta: {
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
