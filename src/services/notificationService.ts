// ── Notification Service ──────────────────────────────────────────────────────
// Registers the device push token with Supabase on login.
// Handles incoming notifications for both patient and doctor.

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants'; // FIX: import Constants for projectId lookup
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications only work on physical devices.');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('Push notification permission denied.');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    // FIX: resolve projectId from EAS config. Fallback 'nishkriti' is the app slug, NOT a valid
    // Expo project ID (those are UUIDs). Push notifications will fail until this is set.
    // TODO: run `eas project:init` to get the real project ID, then either:
    //   1. Add "extra": { "eas": { "projectId": "<uuid>" } } to app.json
    //   2. Or set via `eas.json` config
    projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'nishkriti',
  });
  const token = tokenData.data;

  // Save to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // FIX: cast as any — push_tokens table may not exist in generated types
    await (supabase as any).from('push_tokens')
      .upsert({
        auth_id:    user.id,
        expo_token: token,
        platform:   Platform.OS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'auth_id' });
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Nishkriti',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

// ── Listen for notifications (use in App.tsx or root component) ──────────────
export function setupNotificationListeners(
  onForeground: (notification: Notifications.Notification) => void,
  onTap: (response: Notifications.NotificationResponse) => void,
) {
  const foreground = Notifications.addNotificationReceivedListener(onForeground);
  const tapped     = Notifications.addNotificationResponseReceivedListener(onTap);
  return () => {
    foreground.remove();
    tapped.remove();
  };
}

// ── Schedule local reminders ─────────────────────────────────────────────────
export async function scheduleCheckInReminder(hour = 7, minute = 30) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good morning 👋",
      body: "Time for your daily check-in. It takes 2 minutes.",
      data: { type: 'checkin_reminder' },
      sound: 'default',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function scheduleSupplementReminder(hour = 8, minute = 0) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Supplement reminder 💊",
      body: "Don't forget your morning supplements.",
      data: { type: 'supplement_reminder' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
