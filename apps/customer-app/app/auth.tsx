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
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
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
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
        </View>

        <View style={styles.logoWrap}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </View>

        <Text style={styles.heading}>Welcome to Porter</Text>
        <Text style={styles.subheading}>Sign in to experience premium delivery</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Phone number</Text>
          <View style={styles.phoneRow}>
            <Pressable style={styles.countryPicker}>
              <Text style={styles.countryDial}>+1</Text>
              <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />
            </Pressable>
            <TextInput
              style={styles.phoneInput}
              placeholder="(917) 555-6789"
              placeholderTextColor={Colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              selectionColor={Colors.primary}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push({ pathname: "/otp", params: { phone: `+1 ${phone}` } })}
          >
            <Text style={styles.primaryBtnText}>Continue with Phone number</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socials}>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <FontAwesome name="apple" size={20} color={Colors.text} />
            <Text style={styles.socialText}>Continue with Apple</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <FontAwesome name="google" size={18} color="#EA4335" />
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Ionicons name="mail-outline" size={20} color={Colors.text} />
            <Text style={styles.socialText}>Continue with Email</Text>
          </Pressable>
        </View>

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
  stepLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 72,
    height: 72,
    resizeMode: "contain",
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
    width: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  countryDial: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
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
