import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts } from "@/constants/theme";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(() => router.replace("/welcome"), 800);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.wordmark}>P O R T E R</Text>

        <Animated.View style={[styles.lineWrapper, { opacity: lineAnim }]}>
          <LinearGradient
            colors={["#2A4E8C", "#3B7DD8", "#6BAEE8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.line}
          />
        </Animated.View>

        <Text style={styles.tagline}>Premium Delivery Service</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: 12,
  },
  lineWrapper: {
    width: 200,
    marginVertical: 8,
  },
  line: {
    height: 2,
    borderRadius: 1,
    width: "100%",
  },
  tagline: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
