import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/constants/theme";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          return 100;
        }
        return Math.min(100, p + 2.5);
      });
    }, 60);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => router.replace("/welcome"), 350);
      return () => clearTimeout(t);
    }
  }, [progress]);

  return (
    <LinearGradient
      colors={["#143257", "#0A1F3A", "#050B16"]}
      style={styles.container}
    >
      {/* ambient glow */}
      <View style={styles.glow} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.wordmark}>PORTER</Text>
        <Text style={styles.tagline}>Premium · Delivery · Service</Text>
      </Animated.View>

      <Animated.View style={[styles.progressWrap, { opacity: fadeAnim }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressLabel}>Curating your concierge</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: -180,
    marginTop: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(111,163,200,0.14)",
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 86,
    height: 86,
    resizeMode: "contain",
  },
  wordmark: {
    fontSize: 20,
    fontFamily: Fonts.semibold,
    color: Colors.text,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 5,
    textTransform: "uppercase",
  },
  progressWrap: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 14,
  },
  progressTrack: {
    width: 160,
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
  progressLabel: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
});
