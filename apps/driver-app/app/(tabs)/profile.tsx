import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useOnline } from "@/context/OnlineContext";
import { Button, Card, Eyebrow, StatusPill } from "@/components/ui";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user, signOut } = useAuth();
  const { goOffline } = useOnline();

  const initials = profile ? `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase() : "?";
  const vehicle = [profile?.vehicle_color, profile?.vehicle_make, profile?.vehicle_model].filter(Boolean).join(" ");

  const handleSignOut = () =>
    Alert.alert("Sign out", "You'll go offline and stop receiving jobs.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await goOffline();
          await signOut();
        },
      },
    ]);

  return (
    <ScrollView
      style={{ backgroundColor: Colors.bgDeep }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <StatusPill label="Approved porter" color={Colors.evergreen} />
      </View>

      <Card style={{ gap: 4 }}>
        <Eyebrow>Contact</Eyebrow>
        <Row label="Phone" value={profile?.phone} />
        <Row label="Email" value={user?.email} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Eyebrow>Vehicle</Eyebrow>
        <Row label="Vehicle" value={vehicle} />
        <Row label="Plate" value={profile?.license_plate} />
      </Card>

      <Text style={styles.note}>To change your details, contact Porter support.</Text>

      <Button label="Sign out" variant="secondary" onPress={handleSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { alignItems: "center", gap: 8, marginBottom: 8 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.midnight, borderWidth: 1, borderColor: Colors.cardElevBorder,
  },
  initials: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 28 },
  name: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 22 },
  email: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 15 },
  rowValue: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 15 },
  note: { color: Colors.textDim, fontFamily: Fonts.regular, fontSize: 12, textAlign: "center" },
});
