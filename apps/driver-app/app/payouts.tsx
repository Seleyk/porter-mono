import { Redirect } from "expo-router";

// Stripe sends porters back to porterdriver://payouts after payout sign-up.
// The Profile tab refreshes the payout status when the app comes back.
export default function PayoutsReturn() {
  return <Redirect href="/(tabs)/profile" />;
}
