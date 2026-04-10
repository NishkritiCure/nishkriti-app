import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { SectionCap } from '../../components/SectionCap';
import { NishkritiLogo } from '../../components/NishkritiLogo';
import { Pill } from '../../components/Pill';
import { supabase } from '../../lib/supabase';

// Helper: relative date
const relativeDate = (dateStr: string) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff}d ago`;
};

export const ProtocolEditorScreen = () => {
  const nav = useNavigation<any>();
  const [patients, setPatients] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, prRes] = await Promise.all([
      supabase.from('patient_profiles').select('*').order('onboarded_at', { ascending: false }),
      (supabase.from('protocols').select('patient_id, diet_type, phase_name, current_phase, updated_at, is_active').eq('is_active', true) as any),
    ]);
    if (pRes.data) setPatients(pRes.data);
    if (prRes.data) setProtocols(prRes.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const getProtocol = (patientId: string) => protocols.find((pr: any) => pr.patient_id === patientId);
  const withPlan = patients.filter(p => getProtocol(p.id));
  const withoutPlan = patients.filter(p => !getProtocol(p.id));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.title}>Protocols</Text>
            <NishkritiLogo size={36} showPulse />
          </View>
          <Text style={styles.subtitle}>Treatment plans for your patients</Text>
        </View>

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <Pill label={`${withPlan.length} with active plans`} color="teal" />
          <Pill label={`${withoutPlan.length} without plans`} color={withoutPlan.length > 0 ? 'amber' : 'dim'} />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.teal} style={{ marginTop: 40 }} />
        ) : patients.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 }}>No patients yet</Text>
          </View>
        ) : (
          <>
            {/* Patients without plans first (need attention) */}
            {withoutPlan.length > 0 && (
              <>
                <SectionCap title="Needs plan" />
                {withoutPlan.map(p => (
                  <TouchableOpacity key={p.id} style={styles.patRow}
                    onPress={() => nav.push('TreatmentPlanEditor', { patientId: p.id })} activeOpacity={0.8}>
                    <View style={[styles.dot, { backgroundColor: Colors.ink3 }]} />
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTxt}>{(p.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patName}>{p.full_name}</Text>
                      <Text style={styles.patSub}>No plan — tap to create</Text>
                    </View>
                    <Pill label="No plan" color="dim" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Patients with active plans */}
            {withPlan.length > 0 && (
              <>
                <SectionCap title="Active plans" />
                {withPlan.map(p => {
                  const pr = getProtocol(p.id);
                  const dietLabel = (pr?.diet_type || '').split(',')[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <TouchableOpacity key={p.id} style={styles.patRow}
                      onPress={() => nav.push('TreatmentPlanEditor', { patientId: p.id })} activeOpacity={0.8}>
                      <View style={[styles.dot, { backgroundColor: Colors.teal }]} />
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{(p.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patName}>{p.full_name}</Text>
                        <Text style={styles.patSub}>
                          {dietLabel || '—'} · Phase {pr?.current_phase || 1}{pr?.phase_name ? ` — ${pr.phase_name}` : ''}
                        </Text>
                        {pr?.updated_at && <Text style={styles.patDate}>Updated {relativeDate(pr.updated_at)}</Text>}
                      </View>
                      <Pill label="Active" color="teal" />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.deep },
  headerSection: { padding: Spacing.xl, paddingBottom: Spacing.md },
  title:         { fontFamily: Typography.display, fontSize: 28, color: Colors.ink },
  subtitle:      { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2, marginTop: 4 },
  statsRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  patRow:        { marginHorizontal: Spacing.lg, marginBottom: 6, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 12, borderWidth: 0.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:           { width: 8, height: 8, borderRadius: 4 },
  avatar:        { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.em, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontFamily: Typography.sansMed, fontSize: 14, color: Colors.deep, fontWeight: '600' },
  patName:       { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.ink },
  patSub:        { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  patDate:       { fontFamily: Typography.mono, fontSize: 11, color: Colors.ink3, marginTop: 2 },
});
