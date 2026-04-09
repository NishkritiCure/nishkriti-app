
import React, { useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { NishkritiLogo } from "../../components/NishkritiLogo";
import { MetricCard } from "../../components/MetricCard";
import { PhaseCard } from "../../components/PhaseCard";
import { SectionCap } from "../../components/SectionCap";
import { calcBMI, bmiCategory, todayStr, daysBetween } from "../../utils";
import { supabase } from "../../lib/supabase";

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

export const HomeScreen = () => {
  const nav = useNavigation<any>();
  const { patient, generatePlan, todayPlan } = useAppStore();
  const { profile, checkIns, progress } = patient;
  const todayCI = checkIns.find(c => c.date === todayStr());
  const latest = progress[progress.length - 1];
  const first   = progress[0];
  const bmi = calcBMI(latest?.weight || profile.weightKg, profile.heightCm);
  const bmiCat = bmiCategory(bmi);
  const daysIn = daysBetween(profile.programmeStartDate, todayStr());
  const phaseProgress = Math.min((daysIn % 42) / 42, 1);
  const fbsDelta = latest && first ? `↓ ${Math.round(first.fbs - latest.fbs)}` : undefined;
  const weightDelta = latest && first ? `↓ ${(first.weight - latest.weight).toFixed(1)} kg` : undefined;

  // FIX: refresh patient data from Supabase when screen is focused (production mode)
  useFocusEffect(
    useCallback(() => {
      const { loadPatientFromSupabase, patientLoaded } = useAppStore.getState();
      if (!patientLoaded) loadPatientFromSupabase();
    }, [])
  );

  useEffect(() => {
    if (todayCI && !todayPlan) generatePlan();
  }, [todayCI]);

  const fbs = todayCI?.fbs ?? latest?.fbs ?? 0;
  const fbsStatus = fbs > 180 ? "critical" : fbs > 130 ? "alert" : fbs > 100 ? "warn" : "ok";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.name}>{profile.name.split(" ")[0]}.</Text>
              <Text style={styles.subLabel}>DAY {daysIn} · {new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}</Text>
            </View>
            <View style={styles.logoArea}>
              <LogoutButton />
              <NishkritiLogo size={38} showPulse />
            </View>
          </View>
        </View>

        {/* Check-in banner */}
        {!todayCI ? (
          <TouchableOpacity style={styles.cta} onPress={() => nav.navigate("CheckIn")}>
            <View style={styles.ctaShine} />
            <View>
              <Text style={styles.ctaT1}>Log today's check-in</Text>
              <Text style={styles.ctaT2}>2 min · personalises your plan</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Text style={{ color: Colors.spring, fontSize:22 }}>→</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.checkinDone}>
            <Text style={styles.checkinDoneText}>✓ Check-in logged today</Text>
          </View>
        )}

        {/* Metrics */}
        <View style={styles.metrics}>
          <MetricCard label="FBS" value={fbs} unit="mg/dL" delta={fbsDelta} status={fbsStatus} style={styles.met} />
          <MetricCard label="Weight" value={latest?.weight ?? profile.weightKg} unit="kg" delta={weightDelta} style={styles.met} />
          <MetricCard label="Waist" value={latest?.waist ?? profile.baselineWaist} unit="cm" delta={latest && first ? `↓ ${first.waist! - latest.waist!} cm` : undefined} style={styles.met} />
        </View>

        {/* Phase card */}
        <PhaseCard
          phase={profile.currentPhase}
          name={profile.currentPhase === 1 ? "Sugar Shutdown" : profile.currentPhase === 2 ? "Metabolic Reversal" : "Reversal Confirmation"}
          progress={phaseProgress}
          currentDay={daysIn}
          totalDays={42}
        />

        <SectionCap title="Today" />

        {/* Plan links */}
        {[
          { icon:"🥗", title:"Diet Plan", sub:`${profile.assignedDietType.replace(/_/g," ")} · ${todayPlan ? todayPlan.carbsTarget+"g carbs" : "tap to generate"}`, screen:"Plan", accent: Colors.em },
          { icon:"💪", title:"Workout", sub:`${todayPlan ? todayPlan.workout.type : "45 min"} · Resistance`, screen:"Workout", accent:"rgba(74,144,184,0.15)" },
          { icon:"📊", title:"Progress", sub:`Day ${daysIn} · ${weightDelta || "tracking"}`, screen:"Progress", accent:"rgba(232,184,75,0.1)" },
        ].map(item => (
          <TouchableOpacity key={item.screen} style={styles.planItem} onPress={() => nav.navigate(item.screen)}>
            <View style={[styles.planIcon, { backgroundColor:item.accent }]}>
              <Text style={{ fontSize:26 }}>{item.icon}</Text>
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>{item.title}</Text>
              <Text style={styles.planSub}>{item.sub}</Text>
            </View>
            <Text style={{ color:Colors.ink3, fontSize:22 }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* FBS warning if elevated */}
        {fbs > 130 && (
          <View style={styles.fbsWarning}>
            <Text style={styles.fbsWarnTitle}>FBS elevated today ({fbs} mg/dL)</Text>
            <Text style={styles.fbsWarnBody}>Your plan has been adjusted — reduced carbs, post-meal walks added. {fbs > 180 ? "Your doctor has been notified." : ""}</Text>
          </View>
        )}

        {/* Doctor flag raised */}
        {todayPlan?.doctorFlagRaised && (
          <View style={styles.doctorFlagBanner}>
            <Text style={{ fontSize:19 }}>⚡</Text>
            <View style={{ flex:1 }}>
              <Text style={styles.dfTitle}>Your doctor has been notified</Text>
              <Text style={styles.dfBody}>{todayPlan.doctorFlagReason ?? "Your plan triggered a physician review. Your team will respond within 4 hours."}</Text>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.deep },
  scroll: { flex:1 },
  hero: { padding:Spacing.xl, paddingBottom:Spacing.md, position:"relative" },
  heroGlow: { position:"absolute", inset:0, backgroundColor:"rgba(27,107,84,0.18)" },
  heroRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start" },
  greeting: { fontFamily:Typography.mono, fontSize:13, letterSpacing:2.5, color:Colors.teal, marginBottom:3 },
  name: { fontFamily:Typography.display, fontSize:42, color:Colors.ink, lineHeight:53 },
  subLabel: { fontFamily:Typography.mono, fontSize:13, color:Colors.ink2, marginTop:5, letterSpacing:1.5 },
  logoArea: { alignItems:"flex-end", gap: 10 },
  cta: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.md,
    backgroundColor:Colors.em, borderRadius:Radii.lg,
    padding:Spacing.md, flexDirection:"row", alignItems:"center",
    justifyContent:"space-between", overflow:"hidden", position:"relative",
  },
  ctaShine: { position:"absolute", top:0, left:16, right:16, height:1, backgroundColor:"rgba(168,245,213,0.28)" },
  ctaT1: { fontFamily:Typography.sansMed, fontSize:18, color:Colors.spring, fontWeight:"600", marginBottom:2 },
  ctaT2: { fontFamily:Typography.sans, fontSize:14, color:"rgba(168,245,213,0.55)" },
  ctaArrow: { width:32, height:32, borderRadius:16, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center" },
  checkinDone: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.md,
    backgroundColor:"rgba(62,219,165,0.06)", borderRadius:Radii.md,
    borderWidth:0.5, borderColor:Colors.border2, padding:11,
  },
  checkinDoneText: { fontFamily:Typography.sansMed, fontSize:17, color:Colors.teal, textAlign:"center" },
  metrics: { flexDirection:"row", gap:7, paddingHorizontal:Spacing.lg, marginBottom:Spacing.md },
  met: { flex:1 },
  planItem: {
    marginHorizontal:Spacing.lg, marginBottom:7,
    backgroundColor:Colors.card, borderRadius:Radii.md,
    borderWidth:0.5, borderColor:Colors.border,
    padding:12, flexDirection:"row", alignItems:"center", gap:11,
  },
  planIcon: { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center", flexShrink:0 },
  planInfo: { flex:1 },
  planTitle: { fontFamily:Typography.sansMed, fontSize:17, color:Colors.ink },
  planSub: { fontFamily:Typography.sans, fontSize:14, color:Colors.ink2, marginTop:2 },
  fbsWarning: {
    marginHorizontal:Spacing.lg, marginTop:Spacing.sm,
    backgroundColor:"rgba(217,123,114,0.06)", borderRadius:Radii.md,
    borderLeftWidth:2.5, borderLeftColor:Colors.rose, padding:12,
    borderWidth:0.5, borderColor:"rgba(217,123,114,0.2)",
  },
  fbsWarnTitle: { fontFamily:Typography.sansMed, fontSize:17, color:Colors.rose, marginBottom:4 },
  fbsWarnBody: { fontFamily:Typography.sans, fontSize:14, color:Colors.ink2, lineHeight:20 },
  doctorFlagBanner: { marginHorizontal:Spacing.lg, marginTop:Spacing.sm, backgroundColor:"rgba(217,123,114,0.06)", borderRadius:Radii.md, borderWidth:0.5, borderColor:"rgba(217,123,114,0.25)", padding:12, flexDirection:"row", gap:9, alignItems:"flex-start" },
  dfTitle: { fontFamily:Typography.sansMed, fontSize:17, color:Colors.rose, marginBottom:3 },
  dfBody: { fontFamily:Typography.sans, fontSize:14, color:"rgba(217,123,114,0.8)", lineHeight:20 },
});
