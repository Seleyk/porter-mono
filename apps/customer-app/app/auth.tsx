import { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    GoogleSignin.configure({
      // Add to .env: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      scopes: ["profile", "email"],
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error("No ID token returned");
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) throw error;
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return;
      if (e.code === statusCodes.IN_PROGRESS) return;
      Alert.alert("Google sign-in failed", e.message);
    }
  };

  const handleContinue = async () => {
    if (!isEmailReady || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: Linking.createURL("/") },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Couldn't send code", error.message);
      return;
    }
    router.push({ pathname: "/otp", params: { email: email.trim() } });
  };

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.text} />
            </Pressable>
            <Text style={styles.stepLabel}>Step 1 / 2</Text>
          </View>

          {/* Logo + heading */}
          <View style={styles.logoWrap}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
          </View>
          <View style={styles.headingWrap}>
            <Text style={styles.eyebrow}>Welcome</Text>
            <Text style={styles.heading}>
              {"Good evening.\n"}
              <Text style={styles.headingItalic}>Shall we begin?</Text>
            </Text>
            <Text style={styles.sub}>Sign in to summon your private porter.</Text>
          </View>

          {/* Email input */}
          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={Colors.steel}
            />

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { opacity: !isEmailReady || loading ? 0.45 : pressed ? 0.85 : 1 }]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socials}>
            <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleGoogleSignIn}>
              <FontAwesome name="google" size={17} color="#EA4335" />
              <Text style={styles.socialText}>Continue with Google</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name="mail-outline" size={19} color={Colors.text} />
              <Text style={styles.socialText}>Continue with Email</Text>
            </Pressable>
          </View>

          <Text style={styles.legal}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalLink}>Terms</Text> and{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 36,
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
  stepLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  headingWrap: {
    alignItems: "center",
    marginBottom: 36,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heading: {
    fontSize: 38,
    fontFamily: Fonts.serif,
    color: "#fff",
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.3,
    marginBottom: 14,
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
    lineHeight: 21,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  emailInput: {
    height: 56,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  socials: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.14)",
  },
  socialText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  legal: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 28,
  },
  legalLink: {
    color: Colors.steel,
  },
});
