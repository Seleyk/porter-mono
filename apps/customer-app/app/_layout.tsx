import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold_Italic,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import { Colors } from "@/constants/theme";
import { StripeProvider } from "@stripe/stripe-react-native";

SplashScreen.preventAutoHideAsync();

const AUTH_SCREENS = new Set(["index", "welcome", "auth", "otp", "permissions"]);

function RouteGuard({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    const inAuthFlow = !first || AUTH_SCREENS.has(first);
    const inSetup = first === "setup-profile";

    if (!session && !inAuthFlow) {
      router.replace("/welcome");
    } else if (session && !profile && !inSetup) {
      router.replace("/setup-profile");
    } else if (session && profile && (inAuthFlow || inSetup)) {
      router.replace("/(tabs)");
    }
  }, [session, profile, loading, segments]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Manrope_300Light,
      Manrope_400Regular,
      Manrope_500Medium,
      Manrope_600SemiBold,
      Manrope_700Bold,
      Manrope_800ExtraBold,
      CormorantGaramond_400Regular,
      CormorantGaramond_400Regular_Italic,
      CormorantGaramond_500Medium_Italic,
      CormorantGaramond_600SemiBold_Italic,
      CormorantGaramond_700Bold,
    }).then(() => setFontsLoaded(true));
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <RouteGuard>
        <View style={{ flex: 1, backgroundColor: Colors.bgDeep }} onLayout={onLayoutRootView}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            {/* Onboarding */}
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="permissions" />
            <Stack.Screen name="setup-profile" />
            {/* Main app */}
            <Stack.Screen name="(tabs)" />
            {/* Booking flow */}
            <Stack.Screen name="where-to" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="select-type" />
            <Stack.Screen name="port-details" />
            <Stack.Screen name="dropoff-method" />
            <Stack.Screen name="delivery-method" />
            <Stack.Screen name="finding-porter" />
            <Stack.Screen name="tracking" />
            <Stack.Screen name="proof-of-delivery" />
            <Stack.Screen name="complete" />
            {/* Porter Box */}
            <Stack.Screen name="porter-box-hub" />
            <Stack.Screen name="porter-box-pickup" />
            <Stack.Screen name="porter-box-collected" />
          </Stack>
        </View>
        </RouteGuard>
      </AuthProvider>
    </StripeProvider>
  );
}
