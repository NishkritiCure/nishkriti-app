// Patient auth — UHID + password login
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { supabase } from '../../lib/supabase';

export const PhoneAuthScreen = () => {
  const [uhid, setUhid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const trimmed = uhid.trim().toUpperCase();
    if (!trimmed || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter both your UHID and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const email = trimmed.toLowerCase() + '@nishkriti.internal';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
    }
    // On success, RootNavigator auth listener redirects automatically
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={s.safe}>
        <View style={s.logoWrap}>
          <NishkritiLogo size={56} showPulse />
          <Text style={s.brand}>Nishkriti</Text>
          <Text style={s.deva}>निष्कृति</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.sub}>Sign in with your UHID and password</Text>

          <TextInput
            style={s.input}
            placeholder="NK-0001"
            placeholderTextColor={Colors.ink3}
            autoCapitalize="characters"
            autoCorrect={false}
            value={uhid}
            onChangeText={(t) => setUhid(t.toUpperCase())}
            returnKeyType="next"
          />

          <TextInput
            style={[s.input, { marginTop: Spacing.sm }]}
            placeholder="Password"
            placeholderTextColor={Colors.ink3}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.deep} />
              : <Text style={s.btnText}>Sign In →</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>
          By continuing you agree to Nishkriti's privacy policy and terms of service.
          Your data is end-to-end protected.
        </Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  logoWrap:    { alignItems: 'center', marginBottom: Spacing.xxxl },
  brand:       { fontFamily: Typography.display, fontSize: 42, color: Colors.ink, marginTop: 14 },
  deva:        { fontFamily: Typography.deva, fontSize: 19, color: Colors.ink2, marginTop: 4 },
  card:        { width: '100%', backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 0.5, borderColor: Colors.border2, padding: Spacing.xl },
  title:       { fontFamily: Typography.display, fontSize: 26, color: Colors.ink, marginBottom: 4 },
  sub:         { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, marginBottom: Spacing.lg },
  input:       { width: '100%', backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 14, fontFamily: Typography.sans, fontSize: 20, color: Colors.ink, marginBottom: Spacing.sm },
  btn:         { backgroundColor: Colors.teal, borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontFamily: Typography.sansMed, fontSize: 19, color: Colors.deep, fontWeight: '600', letterSpacing: 0.3 },
  footer:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink3, textAlign: 'center', lineHeight: 20, marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
});
