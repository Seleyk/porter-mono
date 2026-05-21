import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countdown, setCountdown] = useState(19);
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.stepLabel}>Step 2 of 2</Text>
        </View>

        <View style={styles.logoWrap}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </View>

        <Text style={styles.heading}>
          {"Enter the 4-digit code sent\nvia SMS at "}
          <Text style={styles.phoneAccent}>{phone ?? "+1 (917) 333-3002"}</Text>
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.changeLink}>Changed your mobile number?</Text>
        </Pressable>

        <View style={styles.otpRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[styles.otpBox, focusedIndex === i && styles.otpBoxActive]}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              onFocus={() => setFocusedIndex(i)}
              keyboardType="number-pad"
              maxLength={2}
              selectionColor={Colors.primaryLight}
              autoFocus={i === 0}
            />
          ))}
        </View>

        <Text style={styles.countdown}>
          {countdown > 0 ? (
            <>
              {"Resend code in "}
              <Text style={styles.countdownNum}>{countdown}s</Text>
            </>
          ) : (
            <Text style={styles.resendLink} onPress={() => setCountdown(RESEND_SECONDS)}>
              Resend code
            </Text>
          )}
        </Text>

        <View style={styles.altRow}>
          <Pressable
            style={({ pressed }) => [styles.altBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Ionicons name="mail-outline" size={17} color={Colors.text} />
            <Text style={styles.altBtnText}>Login with email</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.altBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color={Colors.text} />
            <Text style={styles.altBtnText}>More options</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.secureCard}>
          <View style={styles.secureIconWrap}>
            <Ionicons name="lock-closed" size={18} color={Colors.primaryLight} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.secureTitle}>Secure verification</Text>
            <Text style={styles.secureDesc}>
              {"Your code is encrypted and expires in 10 minutes.\nNever share this code with anyone."}
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  logoWrap: {
    marginBottom: 24,
  },
  logo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: Colors.text,
    lineHeight: 35,
    marginBottom: 12,
  },
  phoneAccent: {
    color: Colors.primaryLight,
  },
  changeLink: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primaryLight,
    textDecorationLine: "underline",
    marginBottom: 28,
  },
  otpRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  otpBox: {
    flex: 1,
    height: 74,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    textAlign: "center",
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  otpBoxActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.surface,
  },
  countdown: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  countdownNum: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  resendLink: {
    color: Colors.primaryLight,
    fontFamily: Fonts.medium,
  },
  altRow: {
    flexDirection: "row",
    gap: 10,
  },
  altBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  altBtnText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  secureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
  },
  secureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  secureTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  secureDesc: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
