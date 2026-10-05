import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceRequest } from "@porter/shared";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { formatMiles, itemSummary, jobDetails, milesBetween, money } from "@/lib/format";

type Props = {
  job: ServiceRequest;
  from?: { lat: number; lng: number } | null;
  onPress?: () => void;
};

export function Stops({ job }: { job: ServiceRequest }) {
  return (
    <View style={styles.stops}>
      <View style={styles.stopRow}>
        <View style={[styles.dot, { backgroundColor: Colors.steel }]} />
        <Text style={styles.address} numberOfLines={2}>{job.pickup_address}</Text>
      </View>
      <View style={styles.connector} />
      <View style={styles.stopRow}>
        <View style={[styles.dot, { backgroundColor: Colors.gold }]} />
        <Text style={styles.address} numberOfLines={2}>{job.dropoff_address}</Text>
      </View>
    </View>
  );
}

/** Hand-off method, speed and the customer's note, when there are any. */
export function JobDetailsCard({ job }: { job: ServiceRequest }) {
  const { note, handoff, speed } = jobDetails(job);
  if (!note && !handoff && !speed) return null;
  return (
    <View style={[styles.card, { gap: 10 }]}>
      {handoff && (
        <View style={styles.detailRow}>
          <Ionicons name="hand-left-outline" size={16} color={Colors.steel} />
          <Text style={styles.detailText}>{handoff}</Text>
        </View>
      )}
      {speed && (
        <View style={styles.detailRow}>
          <Ionicons name="flash-outline" size={16} color={Colors.steel} />
          <Text style={styles.detailText}>{speed} delivery</Text>
        </View>
      )}
      {note && (
        <View style={{ gap: 4 }}>
          <Text style={styles.noteLabel}>Customer note</Text>
          <Text style={styles.detailText}>{note}</Text>
        </View>
      )}
    </View>
  );
}

export function JobCard({ job, from, onPress }: Props) {
  const pickup = { lat: job.pickup_latitude, lng: job.pickup_longitude };
  const dropoff = { lat: job.dropoff_latitude, lng: job.dropoff_longitude };
  const toPickup = from ? milesBetween(from, pickup) : null;
  const trip = milesBetween(pickup, dropoff);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.price}>{money(job.total_price ?? job.base_price)}</Text>
          <Text style={styles.meta}>{itemSummary(job)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          {toPickup !== null && <Text style={styles.distance}>{formatMiles(toPickup)} away</Text>}
          <Text style={styles.meta}>{trip.toFixed(1)} mi trip</Text>
        </View>
      </View>
      <Stops job={job} />
      {onPress && (
        <View style={styles.footer}>
          <Text style={styles.view}>View job</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.steel} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardElev,
    borderColor: Colors.cardElevBorder,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 14,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  price: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 22 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 13 },
  distance: { color: Colors.steel, fontFamily: Fonts.semibold, fontSize: 14 },
  stops: { gap: 2 },
  stopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  connector: { width: 1, height: 10, backgroundColor: Colors.divider, marginLeft: 3.5 },
  address: { flex: 1, color: Colors.text, fontFamily: Fonts.medium, fontSize: 14 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { flex: 1, color: Colors.text, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  noteLabel: { color: Colors.textDim, fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  view: { color: Colors.steel, fontFamily: Fonts.semibold, fontSize: 13 },
});
