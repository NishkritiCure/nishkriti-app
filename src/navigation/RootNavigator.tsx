import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { Session } from '@supabase/supabase-js';
import { Colors } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { SplashScreen } from '../screens/SplashScreen';
import { PatientNavigator } from './PatientNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
import { DoctorLoginScreen } from '../screens/auth/DoctorLoginScreen';

const AUTH_TIMEOUT_MS = 10000; // 10-second hard timeout
const Root = createStackNavigator();

export const RootNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Hard timeout — if auth check hasn't completed in 10s, show login screen
    timeoutRef.current = setTimeout(() => {
      setAuthChecked(true);
    }, AUTH_TIMEOUT_MS);

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
              // Patient — start loading their data
              useAppStore.getState().loadPatientFromSupabase();
            }
          } catch {
            // Doctor check failed — treat as patient
            setIsDoctor(false);
          }
        }
      } catch {
        // getSession failed — will show login screen
      } finally {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setAuthChecked(true);
      }
    };

    init();

    // Listen for auth state changes (login/logout)
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
          } catch {
            setIsDoctor(false);
          }
        } else {
          setIsDoctor(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Brief loading while checking auth (max 10 seconds)
  if (!authChecked) return (
    <View style={{ flex: 1, backgroundColor: Colors.deep, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.teal} size="large" />
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
        {/* Not logged in — show splash → auth flow */}
        {!session && (
          <>
            <Root.Screen name="Splash" component={SplashScreen} />
            <Root.Screen name="PhoneAuth" component={PhoneAuthScreen} />
            <Root.Screen name="DoctorLogin" component={DoctorLoginScreen} />
          </>
        )}

        {/* Logged in as doctor */}
        {session && isDoctor && (
          <Root.Screen name="Doctor" component={DoctorNavigator} />
        )}

        {/* Logged in as patient */}
        {session && !isDoctor && (
          <Root.Screen name="Patient" component={PatientNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};
