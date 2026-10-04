import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Button, Eyebrow, GradientScreen } from "@/components/ui";

// Matches the email OTP length configured in Supabase Auth (same as the customer app).
const OTP_LENGTH = 8;
const RESEND_SECONDS = 30;

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const verify = async (token: string) => {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email: email ?? "", token, type: "email" });
    setLoading(false);
    if (error) Alert.alert("Invalid code", error.message);
    // On success the route guard moves on to setup, pending or the app.
  };

  const onChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    if (digits.length === OTP_LENGTH) verify(digits);
  };

  const resend = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email: email ?? "" });
    if (error) Alert.alert("Couldn't resend", error.message);
    else setCountdown(RESEND_SECONDS);
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={Colors.text} />
          </Pressable>

          <View style={{ gap: 10 }}>
            <Eyebrow>Verification</Eyebrow>
            <Text style={styles.heading}>Enter the code we sent to {email ?? "your email"}</Text>
          </View>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            autoFocus
            placeholder={"•".repeat(OTP_LENGTH)}
            placeholderTextColor={Colors.textDim}
            selectionColor={Colors.steel}
          />

          <Button label="Verify" onPress={() => verify(code)} disabled={code.length < 6} loading={loading} />

          <Pressable onPress={countdown > 0 ? undefined : resend}>
            <Text style={styles.resend}>
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, gap: 28 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  heading: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 26, lineHeight: 32 },
  input: {
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardElevBorder,
    backgroundColor: Colors.card,
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: "center",
  },
  resend: { color: Colors.steel, fontFamily: Fonts.medium, fontSize: 14, textAlign: "center" },
});
