import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { SectionCap } from '../../components/SectionCap';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { Pill } from '../../components/Pill';
import { supabase } from '../../lib/supabase';

const LogoutButton = () => {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };
  return (
    <TouchableOpacity onPress={handleLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: Colors.border2, backgroundColor: Colors.card }}>
      <Text style={{ fontFamily: Typography.mono, fontSize: 14, color: Colors.rose }}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const Avatar = ({ initials, size = 36 }: { initials: string; size?: number }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.33 }]}>{initials}</Text>
  </View>
);

const StatChip = ({ val, lbl, color }: { val: string | number; lbl: string; color?: string }) => (
  <View style={styles.statChip}>
    <Text style={[styles.statVal, color ? { color } : {}]}>{val}</Text>
    <Text style={styles.statLbl}>{lbl}</Text>
  </View>
);

const FlagCard = ({ patient, onPress }: any) => {
  const latest = patient.checkIns[patient.checkIns.length - 1];
  const isRed = latest?.fbs > 180;
  const borderColor = isRed ? Colors.borderRose : Colors.borderAmber;
  const bg = isRed ? Colors.glowRose : Colors.glowAmber;
  const dotColor = isRed ? Colors.rose : Colors.amber;
  const pillColor = isRed ? 'rose' : 'amber';
  const pillLabel = isRed ? 'FBS Critical' : 'Phase Advance';
  const message = isRed
    ? `FBS ${latest?.fbs} mg/dL — above 180 threshold. Rule DR003 fired. Auto-adjusted. Your review needed.`
    : `FBS averaged ${latest?.fbs} mg/dL consistently. Phase advancement ready. Your approval needed.`;
  return (
    <TouchableOpacity style={[styles.flagCard, { borderColor, backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.flagHead}>
        <View style={[styles.flagDot, { backgroundColor: dotColor }]} />
        <Text style={styles.flagName}>{patient.profile.name}</Text>
        <View style={{ marginLeft: 'auto' }}>
          <Pill label={pillLabel} color={pillColor as any} />
        </View>
      </View>
      <Text style={styles.flagText}>{message}</Text>
      <View style={styles.flagActions}>
        <TouchableOpacity style={[styles.flagBtn, { backgroundColor: dotColor }]} onPress={onPress}>
          <Text style={[styles.flagBtnText, { color: Colors.deep }]}>Review plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.flagBtnSec} onPress={onPress}>
          <Text style={styles.flagBtnSecText}>View profile</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const PatientRow = ({ patient, onPress }: any) => {
  const latest = patient.checkIns[patient.checkIns.length - 1];
  const initials = patient.profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const metricColor = latest?.fbs > 180 ? Colors.rose : latest?.fbs > 130 ? Colors.amber : Colors.spring;
  const metricLabel = patient.profile.primaryCondition === 'pcos'
    ? 'Cycle'
    : patient.profile.primaryCondition === 'hypothyroid'
    ? `TSH`
    : `FBS ${latest?.fbs}`;
  return (
    <TouchableOpacity style={styles.patRow} onPress={onPress} activeOpacity={0.8}>
      <Avatar initials={initials} />
      <View style={styles.patInfo}>
        <Text style={styles.patName}>{patient.profile.name}</Text>
        <Text style={styles.patCond}>
          {patient.profile.primaryCondition.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          {' · '}Phase {patient.profile.currentPhase}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.patMetric, { color: metricColor }]}>{metricLabel}</Text>
        <Text style={styles.patMetricLbl}>today</Text>
      </View>
    </TouchableOpacity>
  );
};

// Row for Supabase-sourced patients (with UHID + credential reveal)
const SupabasePatientRow = ({ patient, onPress }: { patient: any; onPress: () => void }) => {
  const initials = (patient.full_name || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showCredentials = () => {
    Alert.alert(
      'Patient Credentials',
      `UHID: ${patient.uhid}\nPassword: ${patient.initial_password || 'N/A'}`,
      [{ text: 'OK' }],
    );
  };

  return (
    <TouchableOpacity style={styles.patRow} onPress={onPress} onLongPress={showCredentials} activeOpacity={0.8}>
      <Avatar initials={initials} />
      <View style={styles.patInfo}>
        <Text style={styles.patName}>{patient.full_name}</Text>
        <Text style={styles.patCond}>
          {(patient.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
          {' · '}Phase {patient.current_phase || 1}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.patMetric, { color: Colors.teal }]}>{patient.uhid}</Text>
        <TouchableOpacity onPress={showCredentials} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.patMetricLbl, { color: Colors.ink2 }]}>credentials</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const DoctorRosterScreen = () => {
  const nav = useNavigation<any>();

  // Only Supabase patients — no mock data
  const [patients, setPatients] = useState<any[]>([]);

  const fetchPatients = useCallback(async () => {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .order('onboarded_at', { ascending: false });
    // FIX: removed console.log — debug logging should not be in production
    if (data) setPatients(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>Dr. Nishit.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LogoutButton />
              <NishkritiLogo size={44} showPulse />
            </View>
          </View>
          <View style={styles.statsRow}>
            <StatChip val={patients.length} lbl="Patients" />
            <StatChip val={0} lbl="Flags" color={Colors.rose} />
            <StatChip val={0} lbl="Pending" color={Colors.amber} />
            <StatChip val={0} lbl="Check-ins" />
          </View>
        </View>

        {patients.length > 0 ? (
          <>
            <SectionCap title="All patients" />
            {patients.map(p => (
              <SupabasePatientRow
                key={p.id || p.auth_id}
                patient={p}
                // FIX: was onPress={() => {}} — no-op handler prevented patient navigation
                onPress={() => nav.navigate('PatientProfile', { patientId: p.id, supabasePatient: p })}
              />
            ))}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 15, color: Colors.ink3, marginTop: 4 }}>Tap + to create your first patient</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => nav.navigate('CreatePatient')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.deep },
  hero:         { padding: Spacing.xl, paddingBottom: Spacing.lg, backgroundColor: 'rgba(27,107,84,0.12)' },
  heroRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting:     { fontFamily: Typography.mono, fontSize: 13, letterSpacing: 2, color: Colors.teal, marginBottom: 4 },
  name:         { fontFamily: Typography.display, fontSize: 32, color: Colors.ink },
  statsRow:     { flexDirection: 'row', gap: 8, marginTop: 10 },
  statChip:     { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.md, padding: 9, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center' },
  statVal:      { fontFamily: Typography.mono, fontSize: 22, color: Colors.spring },
  statLbl:      { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  flagCard:     { marginHorizontal: Spacing.lg, marginBottom: 8, borderRadius: 17, borderWidth: 0.5, overflow: 'hidden' },
  flagHead:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(217,123,114,0.1)' },
  flagDot:      { width: 7, height: 7, borderRadius: 4 },
  flagName:     { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink },
  flagText:     { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 22, padding: 12, paddingBottom: 0 },
  flagActions:  { flexDirection: 'row', gap: 7, padding: 12, paddingTop: 10 },
  flagBtn:      { flex: 1, padding: 9, borderRadius: 10, alignItems: 'center' },
  flagBtnText:  { fontFamily: Typography.sansMed, fontSize: 15 },
  flagBtnSec:   { flex: 1, padding: 9, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border },
  flagBtnSecText: { fontFamily: Typography.sansMed, fontSize: 15, color: Colors.ink2 },
  patRow:       { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 12, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar:       { backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontFamily: Typography.sansMed, color: Colors.deep, fontWeight: '600' },
  patInfo:      { flex: 1 },
  patName:      { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink },
  patCond:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 2 },
  patMetric:    { fontFamily: Typography.mono, fontSize: 17 },
  patMetricLbl: { fontFamily: Typography.mono, fontSize: 12, color: Colors.ink3, marginTop: 1 },
  fab:          { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText:      { fontSize: 34, color: Colors.deep, fontWeight: '700', marginTop: -2 },
});
