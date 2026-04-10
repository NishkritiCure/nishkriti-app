import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { SectionCap } from '../../components/SectionCap';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { Pill } from '../../components/Pill';
import { DrillDownModal } from '../../components/DrillDownModal';
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

// Tappable stat chip
const StatChip = ({ val, lbl, color, onPress }: { val: string | number; lbl: string; color?: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.statChip} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={[styles.statVal, color ? { color } : {}]}>{val}</Text>
    <Text style={styles.statLbl}>{lbl}</Text>
  </TouchableOpacity>
);

// Helper: relative date label
const relativeDate = (dateStr: string) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff}d ago`;
};

export const DoctorRosterScreen = () => {
  const nav = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [flagCount, setFlagCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const todayISO = new Date().toISOString().split('T')[0];

  // Drill-down modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // Doctor name
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: doc } = await supabase.from('doctors').select('full_name').eq('auth_id', user.id).single();
      if (doc?.full_name) setDoctorName(doc.full_name);
    }
    // Patients with latest check-in
    const { data } = await (supabase
      .from('patient_profiles')
      .select('*, daily_check_ins(check_in_date, fbs_mg_dl, weight_kg)')
      .order('onboarded_at', { ascending: false }) as any);
    if (data) setPatients(data);

    // Counts
    // Flags: flagged + not resolved (mutually exclusive with Unreviewed)
    const { count: flags } = await supabase.from('daily_plans').select('id', { count: 'exact', head: true }).eq('doctor_flag_raised', true).in('flag_status', ['open', 'reviewing']);
    setFlagCount(flags || 0);
    // Unreviewed: not flagged + not reviewed (mutually exclusive with Flags)
    const { count: pending } = await supabase.from('daily_plans').select('id', { count: 'exact', head: true }).is('doctor_reviewed_at', null).or('doctor_flag_raised.is.null,doctor_flag_raised.eq.false');
    setPendingCount(pending || 0);
    const { count: checkins } = await supabase.from('daily_check_ins').select('id', { count: 'exact', head: true }).eq('check_in_date', todayISO);
    setCheckinCount(checkins || 0);
  }, [todayISO]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Drill-down handlers
  const openFlags = async () => {
    const { data } = await (supabase.from('daily_plans').select('id, patient_id, doctor_flag_reason, plan_date, patient_profiles(id, full_name)').eq('doctor_flag_raised', true).in('flag_status', ['open', 'reviewing']).order('plan_date', { ascending: false }).limit(20) as any);
    setModalTitle('Open Flags');
    setModalItems((data || []).map((d: any) => ({
      id: d.patient_profiles?.id || d.patient_id,
      title: d.patient_profiles?.full_name || 'Unknown',
      subtitle: d.doctor_flag_reason || 'Flag raised',
      value: d.plan_date,
    })));
    setModalVisible(true);
  };

  const openPending = async () => {
    const { data } = await (supabase.from('daily_plans').select('id, patient_id, plan_date, diet_type, patient_profiles(id, full_name)').is('doctor_reviewed_at', null).or('doctor_flag_raised.is.null,doctor_flag_raised.eq.false').order('plan_date', { ascending: false }).limit(20) as any);
    setModalTitle('Unreviewed Plans');
    setModalItems((data || []).map((d: any) => ({
      id: d.patient_profiles?.id || d.patient_id,
      title: d.patient_profiles?.full_name || 'Unknown',
      subtitle: d.diet_type ? `Plan: ${d.diet_type}` : 'Unreviewed',
      value: d.plan_date,
    })));
    setModalVisible(true);
  };

  const openCheckins = async () => {
    const { data } = await (supabase.from('daily_check_ins').select('id, patient_id, fbs_mg_dl, weight_kg, patient_profiles(id, full_name)').eq('check_in_date', todayISO).limit(20) as any);
    setModalTitle("Today's Check-ins");
    setModalItems((data || []).map((d: any) => ({
      id: d.patient_profiles?.id || d.patient_id,
      title: d.patient_profiles?.full_name || 'Unknown',
      subtitle: `Weight: ${d.weight_kg || '—'} kg`,
      value: `FBS ${d.fbs_mg_dl || '—'}`,
      valueColor: (d.fbs_mg_dl || 0) > 180 ? Colors.rose : (d.fbs_mg_dl || 0) > 130 ? Colors.amber : Colors.teal,
    })));
    setModalVisible(true);
  };

  const handleModalItem = (patientId: string) => {
    setModalVisible(false);
    nav.navigate('PatientProfile', { patientId });
  };

  // Get latest check-in for a patient from joined data
  const getLatestCI = (p: any) => {
    const cis = p.daily_check_ins || [];
    if (cis.length === 0) return null;
    return cis.sort((a: any, b: any) => (b.check_in_date || '').localeCompare(a.check_in_date || ''))[0];
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{doctorName}.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LogoutButton />
              <NishkritiLogo size={44} showPulse />
            </View>
          </View>
          <View style={styles.statsRow}>
            <StatChip val={patients.length} lbl="Patients" />
            <StatChip val={flagCount} lbl="Flags" color={Colors.rose} onPress={openFlags} />
            <StatChip val={pendingCount} lbl="Unreviewed" color={Colors.amber} onPress={openPending} />
            <StatChip val={checkinCount} lbl="Check-ins" onPress={openCheckins} />
          </View>
        </View>

        {patients.length > 0 ? (
          <>
            <SectionCap title="All patients" />
            {patients.map(p => {
              const ci = getLatestCI(p);
              const initials = (p.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const fbsColor = ci ? ((ci.fbs_mg_dl || 0) > 180 ? Colors.rose : (ci.fbs_mg_dl || 0) > 130 ? Colors.amber : Colors.teal) : Colors.ink3;
              return (
                <TouchableOpacity key={p.id} style={styles.patRow}
                  onPress={() => nav.navigate('PatientProfile', { patientId: p.id, supabasePatient: p })}
                  onLongPress={() => Alert.alert('Credentials', `UHID: ${p.uhid}\nPassword: ${p.initial_password || 'N/A'}`)}
                  activeOpacity={0.8}>
                  <Avatar initials={initials} />
                  <View style={styles.patInfo}>
                    <Text style={styles.patName}>{p.full_name}</Text>
                    <Text style={styles.patCond}>
                      {(p.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      {' · '}Phase {p.current_phase || 1}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {ci ? (
                      <>
                        <Text style={[styles.patMetric, { color: fbsColor }]}>FBS {ci.fbs_mg_dl || '—'}</Text>
                        <Text style={styles.patMetricLbl}>{relativeDate(ci.check_in_date)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.patMetricLbl, { color: Colors.ink3 }]}>No check-ins</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 15, color: Colors.ink3, marginTop: 4 }}>Tap + to create your first patient</Text>
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('CreatePatient')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <DrillDownModal
        visible={modalVisible}
        title={modalTitle}
        items={modalItems}
        onClose={() => setModalVisible(false)}
        onItemPress={handleModalItem}
      />
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
