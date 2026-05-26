import { useState, useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Image, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const OTP_LENGTH = 8;
const RESEND_SECONDS = 30;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(24);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isComplete = digits.every((d) => d !== "");

  const verify = async (token: string) => {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email ?? "", token, type: "email" });
    setLoading(false);
    if (error) {
      Alert.alert("Invalid code", error.message);
      return;
    }
    router.replace("/permissions");
  };

  const handleVerify = () => verify(digits.join(""));

  const handleResend = async () => {
    await supabase.auth.signInWithOtp({ email: email ?? "" });
    setCountdown(RESEND_SECONDS);
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
    if (digit && index === OTP_LENGTH - 1 && next.every((d) => d !== "")) {
      verify(next.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.text} />
            </Pressable>
            <Text style={styles.stepLabel}>Step 2 / 2</Text>
            <Pressable onPress={() => router.replace("/permissions")}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          </View>

          {/* Logo + heading */}
          <View style={styles.logoWrap}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
          </View>
          <Text style={styles.eyebrow}>Verification</Text>
          <Text style={styles.heading}>
            Enter the code we sent{"\n"}to{" "}
            <Text style={styles.phoneAccent}>{email ?? "your email"}</Text>
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[
                  styles.otpBox,
                  focusedIndex === i && styles.otpBoxFocused,
                  digit !== "" && styles.otpBoxFilled,
                ]}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                onFocus={() => setFocusedIndex(i)}
                keyboardType="number-pad"
                maxLength={2}
                selectionColor={Colors.steel}
                autoFocus={i === 0}
              />
            ))}
          </View>

          <Text style={styles.countdown}>
            {countdown > 0 ? (
              <>Resend code in <Text style={styles.countdownNum}>{countdown}s</Text></>
            ) : (
              <Text style={styles.resendLink} onPress={handleResend}>
                Resend code
              </Text>
            )}
          </Text>

          <View style={{ flex: 1 }} />

          {/* Secure card */}
          <View style={styles.secureCard}>
            <View style={styles.secureIconWrap}>
              <Ionicons name="lock-closed" size={18} color={Colors.steel} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.secureTitle}>Secure verification</Text>
              <Text style={styles.secureDesc}>
                Your code is encrypted and expires in 10 minutes.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: isComplete && !loading ? pressed ? 0.85 : 1 : 0.45 },
            ]}
            onPress={handleVerify}
          >
            <Text style={styles.primaryBtnText}>Verify</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  skip: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
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
    fontSize: 32,
    fontFamily: Fonts.serif,
    color: "#fff",
    lineHeight: 40,
    letterSpacing: -0.3,
    marginBottom: 36,
  },
  phoneAccent: {
    fontFamily: Fonts.serifItalic,
    color: Colors.steel,
  },
  otpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    flex: 1,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    textAlign: "center",
    fontSize: 28,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  otpBoxFocused: {
    borderColor: Colors.steel,
    backgroundColor: "rgba(111,163,200,0.06)",
  },
  otpBoxFilled: {
    backgroundColor: "rgba(111,163,200,0.08)",
    borderColor: Colors.steel,
  },
  countdown: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  countdownNum: {
    fontFamily: Fonts.semibold,
    color: Colors.steel,
  },
  resendLink: {
    color: Colors.steel,
    fontFamily: Fonts.semibold,
  },
  secureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    marginBottom: 16,
  },
  secureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: "rgba(111,163,200,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  secureTitle: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  secureDesc: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
