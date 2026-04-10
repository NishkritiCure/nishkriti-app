import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { Pill } from '../../components/Pill';
import { DrillDownModal } from '../../components/DrillDownModal';
import { supabase, getDoctorId } from '../../lib/supabase';
import { DEFAULT_DOCTOR_ID } from '../../lib/constants';

const StatCard = ({ val, lbl, color, onPress }: { val: string | number; lbl: string; color?: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.stat} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={[styles.statVal, color ? { color } : {}]}>{val}</Text>
    <Text style={styles.statLbl}>{lbl}</Text>
  </TouchableOpacity>
);

export const DoctorDashboardScreen = () => {
  const nav = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(DEFAULT_DOCTOR_ID);
  const [flagCount, setFlagCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayISO = new Date().toISOString().split('T')[0];

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<any[]>([]);

  useEffect(() => { getDoctorId().then(id => { if (id) setDoctorId(id); }); }, []);

  const fetchData = useCallback(async () => {
    if (!doctorId) return;
    const { data } = await (supabase.from('patient_profiles').select('*, daily_check_ins(check_in_date, fbs_mg_dl, weight_kg)').eq('assigned_doctor_id', doctorId).order('onboarded_at', { ascending: false }) as any);
    if (data) setPatients(data);
    const { count: flags } = await supabase.from('daily_plans').select('id', { count: 'exact', head: true }).eq('doctor_flag_raised', true).eq('flag_status', 'open');
    setFlagCount(flags || 0);
    const { count: checkins } = await supabase.from('daily_check_ins').select('id', { count: 'exact', head: true }).eq('check_in_date', todayISO);
    setCheckinCount(checkins || 0);
  }, [todayISO, doctorId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Drill-down handlers
  const openPatients = () => {
    setModalTitle('All Patients');
    setModalItems(patients.map(p => ({ id: p.id, title: p.full_name, subtitle: (p.primary_condition || '').replace(/_/g, ' ') })));
    setModalVisible(true);
  };
  const openFlags = async () => {
    const { data } = await (supabase.from('daily_plans').select('id, patient_id, doctor_flag_reason, plan_date, patient_profiles(id, full_name)').eq('doctor_flag_raised', true).eq('flag_status', 'open').limit(20) as any);
    setModalTitle('Open Flags');
    setModalItems((data || []).map((d: any) => ({ id: d.patient_profiles?.id || d.patient_id, title: d.patient_profiles?.full_name || 'Unknown', subtitle: d.doctor_flag_reason, value: d.plan_date })));
    setModalVisible(true);
  };
  const openPending = async () => {
    const { data } = await (supabase.from('daily_plans').select('id, patient_id, doctor_flag_reason, plan_date, patient_profiles(id, full_name)').eq('doctor_flag_raised', true).is('doctor_reviewed_at', null).limit(20) as any);
    setModalTitle('Pending Review');
    setModalItems((data || []).map((d: any) => ({ id: d.patient_profiles?.id || d.patient_id, title: d.patient_profiles?.full_name || 'Unknown', subtitle: d.doctor_flag_reason, value: d.plan_date })));
    setModalVisible(true);
  };
  const openCheckins = async () => {
    const { data } = await (supabase.from('daily_check_ins').select('id, patient_id, fbs_mg_dl, weight_kg, patient_profiles(id, full_name)').eq('check_in_date', todayISO).limit(20) as any);
    setModalTitle("Today's Check-ins");
    setModalItems((data || []).map((d: any) => ({ id: d.patient_profiles?.id || d.patient_id, title: d.patient_profiles?.full_name || 'Unknown', value: `FBS ${d.fbs_mg_dl || '—'}`, valueColor: (d.fbs_mg_dl || 0) > 180 ? Colors.rose : Colors.teal })));
    setModalVisible(true);
  };

  const handleModalItem = (patientId: string) => {
    setModalVisible(false);
    nav.navigate('PatientProfile', { patientId });
  };

  const getLatestCI = (p: any) => {
    const cis = p.daily_check_ins || [];
    return cis.length ? cis.sort((a: any, b: any) => (b.check_in_date || '').localeCompare(a.check_in_date || ''))[0] : null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroSub}>{today}</Text>
              <Text style={styles.heroTitle}>Dashboard</Text>
            </View>
            <NishkritiLogo size={40} showPulse />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard val={patients.length} lbl="Total patients" onPress={openPatients} />
          <StatCard val={flagCount} lbl="Flags" color={Colors.rose} onPress={openFlags} />
          <StatCard val={0} lbl="Pending plans" color={Colors.amber} onPress={openPending} />
          <StatCard val={checkinCount} lbl="Check-ins today" onPress={openCheckins} />
        </View>

        {patients.length > 0 ? (
          <>
            <View style={styles.sectionCap}>
              <Text style={styles.sectionCapText}>ALL PATIENTS</Text>
              <View style={styles.sectionCapLine} />
            </View>
            {patients.map(p => {
              const ci = getLatestCI(p);
              const initials = (p.full_name || '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const condition = (p.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              const fbsColor = ci ? ((ci.fbs_mg_dl || 0) > 180 ? Colors.rose : (ci.fbs_mg_dl || 0) > 130 ? Colors.amber : Colors.teal) : Colors.ink3;
              return (
                <TouchableOpacity key={p.id} style={styles.patRow} onPress={() => nav.navigate('PatientProfile', { patientId: p.id, supabasePatient: p })} activeOpacity={0.8}>
                  <View style={styles.patAvatar}>
                    <Text style={styles.patAvatarTxt}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patName}>{p.full_name}</Text>
                    <Text style={styles.patCond}>{condition} · Phase {p.current_phase || 1}</Text>
                  </View>
                  {ci ? (
                    <Text style={[styles.uhid, { color: fbsColor }]}>FBS {ci.fbs_mg_dl || '—'}</Text>
                  ) : (
                    <Text style={styles.uhid}>{p.uhid}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      <DrillDownModal visible={modalVisible} title={modalTitle} items={modalItems} onClose={() => setModalVisible(false)} onItemPress={handleModalItem} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.deep },
  hero:          { padding: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: 'rgba(27,107,84,0.1)' },
  heroRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroSub:       { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, marginBottom: 4 },
  heroTitle:     { fontFamily: Typography.display, fontSize: 32, color: Colors.ink },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, gap: 8 },
  stat:          { width: '47%', backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, borderWidth: 0.5, borderColor: Colors.border },
  statVal:       { fontFamily: Typography.mono, fontSize: 28, color: Colors.spring, marginBottom: 4 },
  statLbl:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  sectionCap:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm },
  sectionCapText:{ fontFamily: Typography.mono, fontSize: 12, letterSpacing: 3, color: Colors.ink3, textTransform: 'uppercase' },
  sectionCapLine:{ flex: 1, height: 0.5, backgroundColor: Colors.border },
  patRow:        { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radii.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  patAvatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  patAvatarTxt:  { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.deep },
  patName:       { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink },
  patCond:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 1 },
  uhid:          { fontFamily: Typography.mono, fontSize: 14, color: Colors.teal },
});
