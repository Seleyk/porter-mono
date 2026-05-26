import { useState } from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";

const SLIDES = [
  {
    eyebrow: "White-Glove",
    titlePlain: "Every package,",
    titleItalic: "a personal arrival.",
    body: "Trained professionals treat every handoff with the care of a personal concierge.",
  },
  {
    eyebrow: "On Your Schedule",
    titlePlain: "Summon, schedule,",
    titleItalic: "or send same day.",
    body: "Priority dispatch in minutes. Standing appointments for everything else.",
  },
  {
    eyebrow: "Always In View",
    titlePlain: "Track every step,",
    titleItalic: "from door to door.",
    body: "Live location, identity-verified porters, and signature confirmation on arrival.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);

  const slide = SLIDES[idx];

  const next = () => {
    if (idx < SLIDES.length - 1) {
      setIdx(idx + 1);
    } else {
      router.push("/auth");
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed hero image with overlay */}
      <Image
        source={require("../assets/hero.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Dark gradient veil */}
      <LinearGradient
        colors={["rgba(5,11,22,0.55)", "rgba(5,11,22,0.7)", "rgba(5,11,22,0.95)", "#050B16"]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoRow}>
          <Image source={require("../assets/logo.png")} style={styles.logoSmall} />
          <Text style={styles.wordmark}>PORTER</Text>
        </View>
        <Pressable onPress={() => router.push("/auth")} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Slide content */}
      <View key={idx} style={styles.slideContent}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.heading}>
          {slide.titlePlain}{"\n"}
          <Text style={styles.headingItalic}>{slide.titleItalic}</Text>
        </Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dots + counter */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { width: i === idx ? 28 : 6, backgroundColor: i === idx ? Colors.steel : "rgba(255,255,255,0.2)" },
              ]}
            />
          ))}
          <View style={{ flex: 1 }} />
          <Text style={styles.counter}>{idx + 1} / {SLIDES.length}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
          onPress={next}
        >
          <Text style={styles.ctaText}>{idx < SLIDES.length - 1 ? "Continue" : "Get Started"}</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoSmall: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  wordmark: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    letterSpacing: 5,
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  slideContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 18,
  },
  heading: {
    fontSize: 38,
    fontFamily: Fonts.light,
    color: "#fff",
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  headingItalic: {
    fontFamily: Fonts.serifItalic,
    fontSize: 38,
    color: Colors.steel,
    lineHeight: 48,
  },
  body: {
    marginTop: 18,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 24,
    maxWidth: 340,
  },
  controls: {
    paddingHorizontal: 24,
    gap: 22,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  counter: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    letterSpacing: 1,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: Radius.xl,
    backgroundColor: Colors.midnight,
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
