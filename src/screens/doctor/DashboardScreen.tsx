import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { supabase, getDoctorId } from '../../lib/supabase';
import { DEFAULT_DOCTOR_ID } from '../../lib/constants';

const StatCard = ({ val, lbl, color }: { val: string | number; lbl: string; color?: string }) => (
  <View style={styles.stat}>
    <Text style={[styles.statVal, color ? { color } : {}]}>{val}</Text>
    <Text style={styles.statLbl}>{lbl}</Text>
  </View>
);

export const DoctorDashboardScreen = () => {
  const nav = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  // FIX: was hardcoded, now fetched dynamically with fallback
  const [doctorId, setDoctorId] = useState<string | null>(DEFAULT_DOCTOR_ID);
  // FIX: live stats instead of hardcoded 0s
  const [flagCount, setFlagCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getDoctorId().then(id => { if (id) setDoctorId(id); });
  }, []);

  const fetchData = useCallback(async () => {
    if (!doctorId) return;
    // Fetch patients
    const { data } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('assigned_doctor_id', doctorId)
      .order('onboarded_at', { ascending: false });
    if (data) setPatients(data);

    // FIX: fetch live flag count
    const { count: flags } = await supabase
      .from('daily_plans')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_flag_raised', true)
      .eq('flag_status', 'open');
    setFlagCount(flags || 0);

    // FIX: fetch today's check-in count
    const { count: checkins } = await supabase
      .from('daily_check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('check_in_date', todayISO);
    setCheckinCount(checkins || 0);
  }, [todayISO, doctorId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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
          <StatCard val={patients.length} lbl="Total patients" />
          <StatCard val={flagCount} lbl="Flags" color={Colors.rose} />
          <StatCard val={0} lbl="Pending plans" color={Colors.amber} />
          <StatCard val={checkinCount} lbl="Check-ins today" />
        </View>

        {patients.length > 0 ? (
          <>
            <View style={styles.sectionCap}>
              <Text style={styles.sectionCapText}>ALL PATIENTS</Text>
              <View style={styles.sectionCapLine} />
            </View>
            {patients.map(p => {
              const initials = (p.full_name || '')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const condition = (p.primary_condition || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                // FIX: was a non-interactive View — now tappable to open patient profile
                <TouchableOpacity key={p.id} style={styles.patRow} onPress={() => nav.navigate('PatientProfile', { patientId: p.id, supabasePatient: p })} activeOpacity={0.8}>
                  <View style={styles.patAvatar}>
                    <Text style={styles.patAvatarTxt}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patName}>{p.full_name}</Text>
                    <Text style={styles.patCond}>{condition} · Phase {p.current_phase || 1}</Text>
                  </View>
                  <Text style={styles.uhid}>{p.uhid}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
            <Text style={{ fontFamily: Typography.sans, fontSize: 15, color: Colors.ink3, marginTop: 4 }}>Create patients from the Roster tab</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
