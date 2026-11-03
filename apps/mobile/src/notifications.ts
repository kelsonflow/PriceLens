import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";
import { currentIdToken } from "./auth";
import { notificationTargetUrl } from "./notification-target";

export { notificationTargetUrl } from "./notification-target";

const API = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pricelens-api-44ftuum65a-ew.a.run.app").replace(/\/$/, "");
const PUSH_TOKEN_KEY = "pricelens.pushToken";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export function installNotificationResponseHandler() {
  if (Platform.OS === "web") return () => undefined;
  let lastResponseId: string | undefined;
  const openResponse = async (response: Notifications.NotificationResponse | null) => {
    if (!response || response.notification.request.identifier === lastResponseId) return;
    const url = notificationTargetUrl(response.notification.request.content.data);
    if (!url) return;
    lastResponseId = response.notification.request.identifier;
    await Linking.openURL(url);
  };
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => { void openResponse(response); });
  void Notifications.getLastNotificationResponseAsync().then(openResponse);
  return () => subscription.remove();
}

export async function enablePushNotifications(locale: string) {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("price-alerts", { name: "Alertas de preço", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250], lightColor: "#5278E8" });
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("EAS project ID is missing");
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await deviceRequest("POST", { token, platform: Platform.OS, locale, enabled: true });
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return true;
}

export async function disablePushNotifications() {
  if (Platform.OS === "web") return;
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  await deviceRequest("DELETE", { token });
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

async function deviceRequest(method: "POST" | "DELETE", body: unknown) {
  const token = await currentIdToken();
  if (!token) throw new Error("Authentication required");
  const response = await fetch(`${API}/notifications/devices`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Could not update notification preferences");
}
