
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { SectionCap } from "../../components/SectionCap";
import { ReasoningBox } from "../../components/ReasoningBox";
import { ExerciseCard } from "../../components/ExerciseCard";
import { fetchTodayPlan } from "../../services/patientService";

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;

export const WorkoutScreen = () => {
  const storePlan = useAppStore(s => s.todayPlan);
  const [supabasePlan, setSupabasePlan] = useState<any>(null);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  // FIX: fetch plan from Supabase in production
  useFocusEffect(
    React.useCallback(() => {
      if (IS_DEMO) return;
      setLoading(true);
      fetchTodayPlan().then(data => {
        setSupabasePlan(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, [])
  );

  const todayPlan = IS_DEMO ? storePlan : supabasePlan;

  if (loading) return (
    <SafeAreaView style={{ flex:1, backgroundColor:Colors.deep, alignItems:"center", justifyContent:"center" }}>
      <ActivityIndicator color={Colors.teal} size="large" />
    </SafeAreaView>
  );

  if (!todayPlan) return (
    <SafeAreaView style={{ flex:1, backgroundColor:Colors.deep, alignItems:"center", justifyContent:"center" }}>
      <Text style={{ fontFamily:Typography.sans, fontSize:19, color:Colors.ink2 }}>Complete your check-in first.</Text>
    </SafeAreaView>
  );

  const { workout, reasoning } = todayPlan;
  const toggleDone = (id: string) => setDoneIds(d => d.includes(id) ? d.filter(i => i !== id) : [...d, id]);
  const doneCount = doneIds.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.typeLabel}>TODAY'S WORKOUT</Text>
          <Text style={styles.title}>{workout.type}</Text>
          <View style={styles.chips}>
            {[
              { val:workout.durationMinutes.toString(), lbl:"min" },
              { val:workout.exercises.length.toString(), lbl:"exercises" },
              { val:workout.intensity, lbl:"intensity" },
            ].map(c => (
              <View key={c.lbl} style={styles.chip}>
                <Text style={styles.chipVal}>{c.val}</Text>
                <Text style={styles.chipLbl}>{c.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        <ReasoningBox
          label="WHY THIS WORKOUT"
          text={`${workout.intensity.charAt(0).toUpperCase()+workout.intensity.slice(1)} intensity today — adjusted to your energy level and FBS. Tempo-based loading (slow eccentric) makes this workout effective without heavy barbells.`}
          accentColor="rgba(74,144,184,0.7)"
        />

        {/* Progress */}
        {doneCount > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width:`${Math.round(doneCount/workout.exercises.length*100)}%` }]} />
            <Text style={styles.progressText}>{doneCount} of {workout.exercises.length} done</Text>
          </View>
        )}

        <SectionCap title="Exercises — tap to mark done" />

        {workout.exercises.map(ex => (
          <ExerciseCard
            key={ex.id} item={ex}
            done={doneIds.includes(ex.id)}
            onToggleDone={() => toggleDone(ex.id)}
          />
        ))}

        {/* Post-meal walks */}
        {workout.postMealWalks.map((walk, i) => (
          <View key={i} style={styles.walkCard}>
            <View style={styles.walkIcon}>
              <Text style={{ fontSize:26 }}>🚶</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={styles.walkTitle}>Post-{walk.after} walk · {walk.minutes} min</Text>
              <Text style={styles.walkBody}>{walk.reason}</Text>
            </View>
          </View>
        ))}

        {/* Session complete */}
        {doneCount === workout.exercises.length && workout.exercises.length > 0 && (
          <View style={styles.complete}>
            <Text style={styles.completeTitle}>Session complete 🎉</Text>
            <Text style={styles.completeBody}>Great work. Don't forget your post-meal walk.</Text>
          </View>
        )}

        <View style={{ height:Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.deep },
  hero: { padding:Spacing.xl, paddingBottom:Spacing.md, position:"relative" },
  // FIX: replaced inset:0 with explicit edges (inset not valid in RN)
  heroGlow: { position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(74,144,184,0.08)" },
  typeLabel: { fontFamily:Typography.mono, fontSize:12, letterSpacing:3, color:"rgba(74,144,184,0.8)", marginBottom:5 },
  title: { fontFamily:Typography.display, fontSize:34, color:Colors.ink, lineHeight:45, marginBottom:12 },
  chips: { flexDirection:"row", gap:8 },
  chip: { backgroundColor:Colors.card, borderRadius:12, padding:8, borderWidth:0.5, borderColor:Colors.border, alignItems:"center" },
  chipVal: { fontFamily:Typography.mono, fontSize:19, color:Colors.spring },
  chipLbl: { fontFamily:Typography.sans, fontSize:13, color:Colors.ink2, marginTop:2 },
  progressBar: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.sm,
    backgroundColor:Colors.card2, borderRadius:Radii.md,
    height:36, justifyContent:"center", overflow:"hidden", position:"relative",
    borderWidth:0.5, borderColor:Colors.border2,
  },
  progressFill: {
    position:"absolute", left:0, top:0, bottom:0,
    backgroundColor:"rgba(62,219,165,0.15)", borderRadius:Radii.md,
  },
  progressText: {
    fontFamily:Typography.mono, fontSize:15, color:Colors.teal,
    textAlign:"center", zIndex:1,
  },
  walkCard: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.sm,
    backgroundColor:"rgba(62,219,165,0.05)", borderRadius:Radii.lg,
    borderWidth:0.5, borderColor:"rgba(62,219,165,0.2)",
    padding:13, flexDirection:"row", gap:11, alignItems:"center",
  },
  walkIcon: {
    width:40, height:40, borderRadius:12, backgroundColor:Colors.em,
    alignItems:"center", justifyContent:"center",
  },
  walkTitle: { fontFamily:Typography.sansMed, fontSize:17, color:Colors.spring, marginBottom:2 },
  walkBody: { fontFamily:Typography.sans, fontSize:14, color:Colors.ink2, lineHeight:20 },
  complete: {
    marginHorizontal:Spacing.lg, marginTop:Spacing.md,
    backgroundColor:"rgba(62,219,165,0.08)", borderRadius:Radii.lg,
    borderWidth:0.5, borderColor:Colors.border3, padding:Spacing.lg, alignItems:"center",
  },
  completeTitle: { fontFamily:Typography.display, fontSize:22, color:Colors.teal, marginBottom:4 },
  completeBody: { fontFamily:Typography.sans, fontSize:16, color:Colors.ink2 },
});
