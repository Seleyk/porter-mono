import { useState } from "react";
import {
  StyleSheet, Text, View, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function SetupProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const isReady = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleContinue = async () => {
    if (!isReady || loading || !user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      user_type: "customer",
      is_active: true,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Couldn't save profile", error.message);
      return;
    }
    await refreshProfile();
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
          </View>

          {/* Heading */}
          <View style={styles.headingWrap}>
            <Text style={styles.eyebrow}>Almost there</Text>
            <Text style={styles.heading}>
              {"What should we\n"}
              <Text style={styles.headingItalic}>call you?</Text>
            </Text>
            <Text style={styles.sub}>Your name is shown to your porter during a delivery.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Steven"
                placeholderTextColor={Colors.textDim}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoCorrect={false}
                selectionColor={Colors.steel}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Seley"
                placeholderTextColor={Colors.textDim}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoCorrect={false}
                selectionColor={Colors.steel}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: !isReady || loading ? 0.45 : pressed ? 0.85 : 1 },
              ]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryBtnText}>{loading ? "Saving…" : "Continue"}</Text>
              {!loading && <Ionicons name="chevron-forward" size={16} color="#fff" />}
            </Pressable>
          </View>

          {/* Privacy note */}
          <Text style={styles.note}>
            Your information is private and never shared with third parties.
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
  logoWrap: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  headingWrap: {
    alignItems: "center",
    marginBottom: 40,
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
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  input: {
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
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
  note: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textDim,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 28,
  },
});
