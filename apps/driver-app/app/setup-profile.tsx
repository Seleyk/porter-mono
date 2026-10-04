import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button, Eyebrow, GradientScreen } from "@/components/ui";

function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textDim}
        selectionColor={Colors.steel}
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

export default function SetupProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    license_plate: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const isReady =
    form.first_name.trim() !== "" && form.last_name.trim() !== "" && form.phone.replace(/\D/g, "").length >= 10;

  const submit = async () => {
    if (!isReady || loading || !user) return;
    setLoading(true);
    const optional = (v: string) => v.trim() || null;
    // The database sets verification_status to "pending"; staff approve porters.
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      user_type: "porter",
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      vehicle_make: optional(form.vehicle_make),
      vehicle_model: optional(form.vehicle_model),
      vehicle_color: optional(form.vehicle_color),
      license_plate: optional(form.license_plate)?.toUpperCase() ?? null,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Couldn't save your details", error.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 10 }}>
            <Eyebrow>Become a porter</Eyebrow>
            <Text style={styles.heading}>Tell us about you</Text>
            <Text style={styles.sub}>Customers see your first name and vehicle when you take their job.</Text>
          </View>

          <View style={styles.row}>
            <Field label="First name" value={form.first_name} onChangeText={set("first_name")} autoCapitalize="words" />
            <Field label="Last name" value={form.last_name} onChangeText={set("last_name")} autoCapitalize="words" />
          </View>
          <Field label="Mobile number" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" placeholder="(305) 555-0123" />

          <Text style={styles.section}>Vehicle (optional)</Text>
          <View style={styles.row}>
            <Field label="Make" value={form.vehicle_make} onChangeText={set("vehicle_make")} autoCapitalize="words" placeholder="Toyota" />
            <Field label="Model" value={form.vehicle_model} onChangeText={set("vehicle_model")} autoCapitalize="words" placeholder="Camry" />
          </View>
          <View style={styles.row}>
            <Field label="Color" value={form.vehicle_color} onChangeText={set("vehicle_color")} autoCapitalize="words" placeholder="Black" />
            <Field label="Plate" value={form.license_plate} onChangeText={set("license_plate")} autoCapitalize="characters" placeholder="ABC1234" />
          </View>

          <Button label="Submit for review" icon="chevron-forward" onPress={submit} disabled={!isReady} loading={loading} />
          <Button label="Use a different email" variant="secondary" onPress={signOut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 18 },
  heading: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 28, lineHeight: 34 },
  sub: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21 },
  section: { color: Colors.textMuted, fontFamily: Fonts.semibold, fontSize: 13, marginTop: 6 },
  row: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 8 },
  label: { color: Colors.textMuted, fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  input: {
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    color: Colors.text,
    fontFamily: Fonts.medium,
    fontSize: 16,
    paddingHorizontal: 14,
  },
});
