import { useState } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useBookingStore } from "@/store/bookingStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Radius } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { addTip, getBooking } from "@/services/booking";
import { supabase } from "@/lib/supabase";

const SERVICE_FEE = 3.5;

const TIPS = [
  { label: "$3", value: 3 },
  { label: "$5", value: 5 },
  { label: "$8", value: 8 },
  { label: "$12", value: 12 },
];

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const { deliverySpeed, bookingId, reset, calculatedFare } = useBookingStore();
  const { user, profile } = useAuth();
  const speedLabel = deliverySpeed === "priority" ? "Priority Delivery" : deliverySpeed === "standard" ? "Standard Delivery" : "Scheduled Delivery";
  const speedPrice = calculatedFare ?? (deliverySpeed === "priority" ? 28 : deliverySpeed === "standard" ? 18 : 16);
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const total = speedPrice + SERVICE_FEE + (tip ?? 0);
  const firstName = profile?.first_name ?? "there";

  const handleDone = async () => {
    setSaving(true);
    if (bookingId) {
      if (tip && tip > 0) await addTip(bookingId, tip).catch(console.error);
      if (rating > 0 && user) {
        const booking = await getBooking(bookingId);
        if (booking?.porter_id) {
          const { error } = await supabase.from("ratings").insert({
            request_id: bookingId,
            rater_id: user.id,
            rated_id: booking.porter_id,
            rating,
          });
          if (error) console.error(error);
        }
      }
    }
    reset();
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient colors={["#143257", "#0A1F3A", "#050B16"]} style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 8 }}>
          {/* Checkmark */}
          <View style={styles.checkWrap}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={36} color={Colors.evergreen} />
            </View>
          </View>

          {/* Thank you */}
          <View style={styles.thankWrap}>
            <Text style={styles.eyebrow}>Delivered</Text>
            <Text style={styles.heading}>
              Thank you,{"\n"}
              <Text style={styles.headingItalic}>{firstName}.</Text>
            </Text>
            <Text style={styles.sub}>Your items have been delivered successfully.</Text>
          </View>

          {/* Star rating */}
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How was your porter?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)} hitSlop={8}>
                  <Ionicons
                    name={s <= rating ? "star" : "star-outline"}
                    size={32}
                    color={s <= rating ? Colors.gold : Colors.textDim}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Gratuity */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>Add gratuity</Text>
            <View style={styles.tipRow}>
              {TIPS.map((t) => (
                <Pressable
                  key={t.value}
                  style={[styles.tipBtn, tip === t.value && styles.tipBtnActive]}
                  onPress={() => setTip(tip === t.value ? null : t.value)}
                >
                  <Text style={[styles.tipBtnText, tip === t.value && styles.tipBtnTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Receipt */}
          <View style={styles.receipt}>
            <Text style={styles.receiptTitle}>Receipt</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{speedLabel}</Text>
              <Text style={styles.receiptValue}>${speedPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service fee</Text>
              <Text style={styles.receiptValue}>${SERVICE_FEE.toFixed(2)}</Text>
            </View>
            {tip !== null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Gratuity</Text>
                <Text style={styles.receiptValue}>${tip.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotal}>Total</Text>
              <Text style={styles.receiptTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1, marginTop: 12 }]}
          onPress={handleDone}
          disabled={saving}
        >
          <Text style={styles.ctaText}>{saving ? "Saving…" : "Done"}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  checkWrap: {
    alignItems: "center",
    marginTop: 12,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(78,111,100,0.15)",
    borderWidth: 1,
    borderColor: "rgba(78,111,100,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  thankWrap: {
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.steel,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 38,
    fontFamily: Fonts.serif,
    color: "#fff",
    textAlign: "center",
    lineHeight: 46,
    letterSpacing: -0.3,
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
    lineHeight: 22,
  },
  ratingCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    alignItems: "center",
    gap: 14,
  },
  ratingTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  stars: {
    flexDirection: "row",
    gap: 10,
  },
  tipCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 14,
  },
  tipTitle: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
  },
  tipBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tipBtnActive: {
    backgroundColor: "rgba(229,201,122,0.12)",
    borderColor: "rgba(229,201,122,0.4)",
  },
  tipBtnText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.textMuted,
  },
  tipBtnTextActive: {
    color: Colors.gold,
  },
  receipt: {
    backgroundColor: "rgba(20,46,80,0.55)",
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.18)",
    padding: 20,
    gap: 10,
  },
  receiptTitle: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: Colors.textDim,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  receiptDivider: {
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  receiptTotal: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: Colors.text,
  },
  receiptTotalValue: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#fff",
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: Colors.midnight,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: "rgba(111,163,200,0.4)",
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: "#fff",
    letterSpacing: 0.3,
  },
});
