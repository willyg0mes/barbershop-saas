import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color="#D4AF37" size="large" />
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#2a2a2a",
        },
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Agenda" }} />
      <Tabs.Screen name="finance" options={{ title: "Financeiro" }} />
      <Tabs.Screen
        name="appointment/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
