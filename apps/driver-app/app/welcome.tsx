import { useState } from "react";
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Button, Eyebrow, GradientScreen } from "@/components/ui";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isEmailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isEmailReady || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    if (error) {
      Alert.alert("Couldn't send code", error.message);
      return;
    }
    router.push({ pathname: "/otp", params: { email: email.trim() } });
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
            <Text style={styles.wordmark}>PORTER</Text>
            <Text style={styles.tag}>Driver</Text>
          </View>

          <View style={styles.headingWrap}>
            <Eyebrow>Drive with Porter</Eyebrow>
            <Text style={styles.heading}>Earn on your schedule in Miami.</Text>
            <Text style={styles.sub}>Sign in or create your porter account with your email.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              selectionColor={Colors.steel}
              onSubmitEditing={handleContinue}
            />
            <Button label="Continue" icon="chevron-forward" onPress={handleContinue} disabled={!isEmailReady} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 36 },
  brand: { alignItems: "center", gap: 10 },
  logo: { width: 72, height: 72, resizeMode: "contain" },
  wordmark: { color: Colors.text, fontFamily: Fonts.semibold, fontSize: 18, letterSpacing: 8 },
  tag: { color: Colors.gold, fontFamily: Fonts.semibold, fontSize: 11, letterSpacing: 5, textTransform: "uppercase" },
  headingWrap: { gap: 10 },
  heading: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 30, lineHeight: 36 },
  sub: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  form: { gap: 12 },
  label: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  input: {
    height: 54,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    color: Colors.text,
    fontFamily: Fonts.medium,
    fontSize: 16,
    paddingHorizontal: 16,
  },
});
