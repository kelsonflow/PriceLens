import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth";
import { SubscriptionsProvider } from "../src/subscriptions";

export default function Layout() {
  return (
    <AuthProvider>
      <SubscriptionsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionsProvider>
    </AuthProvider>
  );
}
