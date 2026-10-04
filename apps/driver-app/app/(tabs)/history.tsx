import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceRequest } from "@porter/shared";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { fetchJobHistory } from "@/services/jobs";
import { Stops } from "@/components/JobCard";
import { Card, Eyebrow, StatusPill } from "@/components/ui";
import { itemSummary, money, shortDate } from "@/lib/format";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setJobs(await fetchJobHistory(user.id));
    } catch {
      // Leave the list as it was.
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const completed = jobs.filter((j) => j.status === "completed");
  const total = completed.reduce((sum, j) => sum + (j.total_price ?? j.base_price ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.steel} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <Text style={styles.title}>Jobs</Text>
            <Card style={styles.summary}>
              <View style={{ gap: 4 }}>
                <Eyebrow>Completed</Eyebrow>
                <Text style={styles.summaryValue}>{completed.length}</Text>
              </View>
              <View style={{ gap: 4, alignItems: "flex-end" }}>
                <Eyebrow>Job totals</Eyebrow>
                <Text style={styles.summaryValue}>{money(total)}</Text>
              </View>
            </Card>
            <Text style={styles.note}>Payouts arrive once Stripe payouts are set up.</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <Card style={{ alignItems: "center", gap: 8, paddingVertical: 28 }}>
              <Ionicons name="receipt-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.muted}>Jobs you finish show up here.</Text>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ gap: 12 }}>
            <View style={styles.row}>
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={styles.price}>{money(item.total_price ?? item.base_price)}</Text>
                <Text style={styles.meta}>
                  {itemSummary(item)} · {shortDate(item.actual_dropoff_time ?? item.created_at)}
                </Text>
              </View>
              <StatusPill
                label={item.status === "completed" ? "Delivered" : "Cancelled"}
                color={item.status === "completed" ? Colors.evergreen : Colors.textDim}
              />
            </View>
            <Stops job={item} />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDeep },
  list: { padding: 20, gap: 12 },
  title: { color: Colors.text, fontFamily: Fonts.serif, fontSize: 28 },
  summary: { flexDirection: "row", justifyContent: "space-between" },
  summaryValue: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 24 },
  note: { color: Colors.textDim, fontFamily: Fonts.regular, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  price: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 18 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 13 },
  muted: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: 14, textAlign: "center" },
});
