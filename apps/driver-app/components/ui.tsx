import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";

export const BG_GRADIENT = ["#143257", "#0A1F3A", "#050B16"] as const;

export function GradientScreen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={BG_GRADIENT} style={[{ flex: 1 }, style]}>
      {children}
    </LinearGradient>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, icon, disabled, loading, variant = "primary", style }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" && styles.btnPrimary,
        variant === "secondary" && styles.btnSecondary,
        variant === "danger" && styles.btnDanger,
        { opacity: inactive ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text} />
      ) : (
        <>
          <Text style={styles.btnText}>{label}</Text>
          {icon && <Ionicons name={icon} size={16} color={Colors.text} />}
        </>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  btnPrimary: { backgroundColor: Colors.midnight, borderWidth: 1, borderColor: Colors.cardElevBorder },
  btnSecondary: { backgroundColor: Colors.buttonSecondary, borderWidth: 1, borderColor: Colors.cardBorder },
  btnDanger: { backgroundColor: "rgba(200,80,80,0.18)", borderWidth: 1, borderColor: "rgba(200,80,80,0.4)" },
  btnText: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 15, letterSpacing: 0.3 },
  card: {
    backgroundColor: Colors.cardElev,
    borderColor: Colors.cardElevBorder,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 16,
  },
  eyebrow: {
    color: Colors.steel,
    fontFamily: Fonts.semibold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
});
