import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts, Radius } from "@/constants/theme";

const FEATURES = [
  {
    icon: "🎩",
    title: "White-Glove Service",
    description: "Professional handlers treat every package with care",
  },
  {
    icon: "⚡",
    title: "Express Delivery",
    description: "Same-day and scheduled premium delivery options",
  },
  {
    icon: "📍",
    title: "Real-Time Tracking",
    description: "Know exactly where your package is, every step",
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🎩</Text>
          <Text style={styles.logoText}>PORTER</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLine}>Elevate Every</Text>
          <Text style={[styles.heroLine, styles.heroAccent]}>Delivery</Text>
          <Text style={styles.heroLine}>Experience</Text>
          <Text style={styles.heroSub}>
            Premium delivery service that treats your packages like they deserve.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Text style={styles.ctaArrow}>›</Text>
        </Pressable>
        <Text style={styles.legal}>
          By continuing, you agree to our{" "}
          <Text style={styles.legalLink}>Terms</Text> and{" "}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  logoIcon: {
    fontSize: 20,
  },
  logoText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: 4,
  },
  hero: {
    marginTop: 24,
    marginBottom: 32,
    gap: 0,
  },
  heroLine: {
    fontSize: 42,
    fontFamily: Fonts.bold,
    color: Colors.text,
    lineHeight: 52,
  },
  heroAccent: {
    color: Colors.primary,
  },
  heroSub: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: 16,
  },
  features: {
    gap: 12,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 16,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
    backgroundColor: Colors.background,
  },
  cta: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  ctaArrow: {
    fontSize: 22,
    color: Colors.text,
    lineHeight: 24,
  },
  legal: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  legalLink: {
    textDecorationLine: "underline",
    color: Colors.textSecondary,
  },
});
