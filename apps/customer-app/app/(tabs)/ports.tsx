import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Fonts } from "@/constants/theme";

export default function PortsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.label}>Porter Boxes</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});
