import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider } from "../src/auth";
import { installNotificationResponseHandler } from "../src/notifications";
import { SubscriptionsProvider } from "../src/subscriptions";

export default function Layout() {
  useEffect(() => installNotificationResponseHandler(), []);

  return (
    <AuthProvider>
      <SubscriptionsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionsProvider>
    </AuthProvider>
  );
}
