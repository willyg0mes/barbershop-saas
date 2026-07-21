import Constants from "expo-constants";
import { Platform } from "react-native";
import { updateFcmToken } from "@/lib/api";

/** Push remoto não funciona no Expo Go (SDK 53+). Só em APK / dev build. */
export function isPushSupported(): boolean {
  if (Platform.OS === "web") {
    return false;
  }

  // Expo Go: appOwnership === "expo" OU executionEnvironment === "storeClient"
  if (Constants.appOwnership === "expo") {
    return false;
  }

  if (Constants.executionEnvironment === "storeClient") {
    return false;
  }

  return true;
}

export async function registerPushToken(authToken: string): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  // Import dinâmico: evita crash no Expo Go ao carregar o módulo
  const Notifications = await import("expo-notifications");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync();
  await updateFcmToken(authToken, pushToken.data);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("appointments", {
      name: "Agendamentos",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 120, 80, 120],
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return pushToken.data;
}

export async function showLocalNotification(title: string, body: string) {
  if (!isPushSupported()) {
    return;
  }

  const Notifications = await import("expo-notifications");
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
