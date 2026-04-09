// Doctor auth — email + password
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { supabase } from '../../lib/supabase';

export const DoctorLoginScreen = () => {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
    // On success, RootNavigator listener redirects automatically
  };

  const forgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email address first.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Check your email', 'A password reset link has been sent.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={s.safe}>
        <View style={s.logoWrap}>
          <NishkritiLogo size={52} showPulse />
          <Text style={s.brand}>Nishkriti</Text>
          <Text style={s.role}>CLINICAL · DOCTOR LOGIN</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Doctor sign-in</Text>
          <Text style={s.sub}>Use your registered email and password</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="doctor@nishkriti.com"
            placeholderTextColor={Colors.ink3}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.ink3}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={signIn}
            />
            <TouchableOpacity
              style={s.togglePass}
              onPress={() => setShowPass(s => !s)}
            >
              <Text style={s.togglePassText}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={forgotPassword} style={s.forgot}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={signIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.deep} />
              : <Text style={s.btnText}>Sign in to Nishkriti →</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.helpCard}>
          <Text style={s.helpTitle}>Need access?</Text>
          <Text style={s.helpText}>
            If you haven't received your login credentials, contact the Nishkriti team at support@nishkriti.com
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  logoWrap:   { alignItems: 'center', marginBottom: Spacing.xxl },
  brand:      { fontFamily: Typography.display, fontSize: 40, color: Colors.ink, marginTop: 12 },
  role:       { fontFamily: Typography.mono, fontSize: 13, letterSpacing: 3, color: Colors.teal, marginTop: 6, opacity: 0.7 },
  card:       { width: '100%', backgroundColor: Colors.card, borderRadius: Radii.xl, borderWidth: 0.5, borderColor: Colors.border2, padding: Spacing.xl, marginBottom: Spacing.lg },
  title:      { fontFamily: Typography.display, fontSize: 26, color: Colors.ink, marginBottom: 4 },
  sub:        { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, marginBottom: Spacing.lg },
  label:      { fontFamily: Typography.mono, fontSize: 13, letterSpacing: 2, color: Colors.ink2, marginBottom: 6 },
  input:      { backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 14, fontFamily: Typography.sans, fontSize: 19, color: Colors.ink, marginBottom: Spacing.md },
  passRow:    { flexDirection: 'row', marginBottom: 4 },
  togglePass: { backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2, borderTopRightRadius: Radii.md, borderBottomRightRadius: Radii.md, paddingHorizontal: 14, justifyContent: 'center' },
  togglePassText: { fontSize: 21 },
  forgot:     { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: 4 },
  forgotText: { fontFamily: Typography.sans, fontSize: 15, color: Colors.teal },
  btn:        { backgroundColor: Colors.teal, borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center' },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { fontFamily: Typography.sansMed, fontSize: 19, color: Colors.deep, fontWeight: '600', letterSpacing: 0.3 },
  helpCard:   { width: '100%', backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md },
  helpTitle:  { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.ink, marginBottom: 4 },
  helpText:   { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 20 },
});
