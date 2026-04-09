import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { Session } from '@supabase/supabase-js';
import { Colors } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { SplashScreen } from '../screens/SplashScreen';
import { PatientNavigator } from './PatientNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
import { DoctorLoginScreen } from '../screens/auth/DoctorLoginScreen';

// ── DEMO MODE (no Supabase) ───────────────────────────────────────────────────
// Set to false when Supabase is configured (EXPO_PUBLIC_SUPABASE_URL is set)
const DEMO_MODE = !process.env.EXPO_PUBLIC_SUPABASE_URL;

const Root = createStackNavigator();

export const RootNavigator = () => {
  const { mode, splashDone } = useAppStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [authChecked, setAuthChecked] = useState(DEMO_MODE); // skip check in demo

  useEffect(() => {
    if (DEMO_MODE) return; // use mock store in demo mode

    // FIX: wrapped entire Supabase init in try/catch with .catch() on import
    // Any failure at any point must still set authChecked=true to avoid black screen
    import('../lib/supabase').then(({ supabase }) => {
      if (!supabase) { setAuthChecked(true); return; }

      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        if (session) {
          try {
            const { data } = await supabase
              .from('doctors')
              .select('id')
              .eq('auth_id', session.user.id)
              .single();
            setIsDoctor(!!data);
            if (!data) {
              useAppStore.getState().loadPatientFromSupabase();
            }
          } catch {}
        }
        setAuthChecked(true);
      }).catch(() => {
        setAuthChecked(true);
      });

      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            if (session) {
              try {
                const { data } = await supabase
                  .from('doctors')
                  .select('id')
                  .eq('auth_id', session.user.id)
                  .single();
                setIsDoctor(!!data);
                if (!data) {
                  useAppStore.getState().loadPatientFromSupabase();
                }
              } catch {}
            } else {
              setIsDoctor(false);
            }
          }
        );
        return () => subscription.unsubscribe();
      } catch {}
    }).catch(() => {
      // FIX: if dynamic import itself fails, still show the app (splash/auth screens)
      setAuthChecked(true);
    });
  }, []);

  // FIX: show loading text instead of null — null causes black screen while checking auth
  if (!authChecked) return (
    <View style={{ flex: 1, backgroundColor: '#020604', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#3EDBA5', fontSize: 16, fontFamily: 'System' }}>Connecting...</Text>
    </View>
  );

  const nav_theme = {
    dark: true,
    colors: {
      primary: Colors.teal,
      background: Colors.deep,
      card: Colors.deep,
      text: Colors.ink,
      border: Colors.border,
      notification: Colors.rose,
    },
  };

  return (
    <NavigationContainer theme={nav_theme}>
      <Root.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.deep },
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: { opacity: current.progress },
          }),
        }}
      >
        {/* ── DEMO MODE ── */}
        {DEMO_MODE && !splashDone && (
          <Root.Screen name="Splash" component={SplashScreen} />
        )}
        {DEMO_MODE && splashDone && mode === 'doctor' && (
          <Root.Screen name="Doctor" component={DoctorNavigator} />
        )}
        {DEMO_MODE && splashDone && mode !== 'doctor' && (
          <Root.Screen name="Patient" component={PatientNavigator} />
        )}

        {/* ── PRODUCTION MODE (Supabase auth) ── */}
        {!DEMO_MODE && !session && (
          <Root.Screen name="Splash" component={SplashScreen} />
        )}
        {!DEMO_MODE && !session && (
          <Root.Screen name="PhoneAuth" component={PhoneAuthScreen} />
        )}
        {!DEMO_MODE && !session && (
          <Root.Screen name="DoctorLogin" component={DoctorLoginScreen} />
        )}
        {!DEMO_MODE && session && isDoctor && (
          <Root.Screen name="Doctor" component={DoctorNavigator} />
        )}
        {!DEMO_MODE && session && !isDoctor && (
          <Root.Screen name="Patient" component={PatientNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};
