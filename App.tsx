import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import {
  useFonts,
  Lora_400Regular,
  Lora_500Medium,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
} from '@expo-google-fonts/dm-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { registerForPushNotifications } from './src/services/notificationService';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lora-Italic':    Lora_400Regular_Italic,
    'Lora-Medium':    Lora_500Medium,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium':  DMSans_500Medium,
    'DMMono-Regular': DMMono_400Regular,
  });

  // Register push notifications on mount
  useEffect(() => {
    registerForPushNotifications().catch(() => {
      // Silently fail — notifications are optional
    });

    // Handle notifications tapped while app is in background/closed
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Navigation handled by RootNavigator listening to notification data
      if (__DEV__) console.log('Notification tapped:', data);
    });
    return () => sub.remove();
  }, []);

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // FIX: show minimal loading indicator instead of null — null causes black screen if fonts fail
  if (!fontsLoaded) return (
    <View style={{ flex: 1, backgroundColor: '#020604', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#3EDBA5', fontSize: 18, fontFamily: 'System' }}>Loading...</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#020604' }} onLayout={onLayout}>
          <StatusBar style="light" backgroundColor="#020604" />
          <RootNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
