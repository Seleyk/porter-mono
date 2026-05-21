import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts, Radius } from "@/constants/theme";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
        </View>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🎩</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome to Porter</Text>
        <Text style={styles.subheading}>Sign in to experience premium delivery</Text>

        {/* Phone input */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneRow}>
            <Pressable style={styles.countryPicker}>
              <Text style={styles.flag}>🇺🇸</Text>
              <Text style={styles.countryChevron}>▾</Text>
            </Pressable>
            <TextInput
              style={styles.phoneInput}
              placeholder="+1 (917) 555-6789"
              placeholderTextColor={Colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              selectionColor={Colors.primary}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {/* TODO: send OTP */}}
          >
            <Text style={styles.primaryBtnText}>Continue with Phone number</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social auth */}
        <View style={styles.socials}>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialText}>Continue with Apple</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.socialIcon}>✉</Text>
            <Text style={styles.socialText}>Continue with Email</Text>
          </Pressable>
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          By continuing, you agree to receive texts from Porter.{"\n"}
          Message and data rates may apply.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 18,
    color: Colors.text,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 48,
  },
  heading: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  flag: {
    fontSize: 20,
  },
  countryChevron: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.text,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
  socials: {
    gap: 10,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.buttonSecondary,
    borderRadius: Radius.xl,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  socialIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
  },
  socialText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  legal: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 28,
  },
});
