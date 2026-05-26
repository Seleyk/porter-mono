import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, active: IoniconsName, inactive: IoniconsName) {
  return ({ color }: { color: string }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 68,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 26 : 10,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ports"
        options={{
          title: "Ports",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
