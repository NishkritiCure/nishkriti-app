import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { SectionCap } from "../../components/SectionCap";
import { ReasoningBox } from "../../components/ReasoningBox";
import { MealCard } from "../../components/MealCard";
import { Pill } from "../../components/Pill";
import { fetchTodayPlan } from "../../services/patientService";

const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;
const HIGH_FBS_RULES = ["DR002","DR003","DR004","PC002","PC003"];
const CRITICAL_RULES = ["DR004","PC003"];

export const DietPlanScreen = () => {
  const storePlan = useAppStore(s => s.todayPlan);
  const [supabasePlan, setSupabasePlan] = useState<any>(null);
  const [loading, setLoading] = useState(!IS_DEMO);

  // FIX: fetch plan from Supabase in production mode
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

  // Use Supabase plan if available, otherwise fall back to store
  const rawPlan = IS_DEMO ? storePlan : supabasePlan;
  // Map Supabase column names to camelCase if needed
  const todayPlan = rawPlan ? {
    reasoning: rawPlan.reasoning,
    dietType: rawPlan.dietType || rawPlan.diet_type,
    carbsTarget: rawPlan.carbsTarget || rawPlan.carbs_target_g,
    proteinTarget: rawPlan.proteinTarget || rawPlan.protein_target_g,
    fatTarget: rawPlan.fatTarget || rawPlan.fat_target_g,
    calorieTarget: rawPlan.calorieTarget || rawPlan.calorie_target,
    waterTargetMl: rawPlan.waterTargetMl || rawPlan.water_target_ml,
    meals: rawPlan.meals || [],
    rulesFired: rawPlan.rulesFired || rawPlan.rules_fired || [],
    doctorFlagRaised: rawPlan.doctorFlagRaised ?? rawPlan.doctor_flag_raised,
    doctorFlagReason: rawPlan.doctorFlagReason || rawPlan.doctor_flag_reason,
    supplementNote: rawPlan.supplementNote || rawPlan.supplement_note,
    supplements: rawPlan.supplements || [],
    workout: rawPlan.workout || {},
  } : null;

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={Colors.teal} size="large" style={{ marginTop: 100 }} />
    </SafeAreaView>
  );

  if (!todayPlan) return (
    <SafeAreaView style={s.safe}>
      <View style={s.empty}>
        <Text style={s.emptyTitle}>No plan yet</Text>
        <Text style={s.emptyText}>Complete your morning check-in and we'll generate your personalised plan.</Text>
      </View>
    </SafeAreaView>
  );

  const {
    reasoning, dietType, carbsTarget, proteinTarget, fatTarget,
    calorieTarget, waterTargetMl, meals, rulesFired,
    doctorFlagRaised, doctorFlagReason, supplementNote,
  } = todayPlan;

  // FIX: safely handle rulesFired which could be array of objects with ruleId or rule_id keys
  const rules = (rulesFired || []).map((r: any) => ({ ruleId: r.ruleId || r.rule_id, message: r.message }));
  const isAdjusted  = rules.some((r: any) => HIGH_FBS_RULES.includes(r.ruleId));
  const isCritical  = rules.some((r: any) => CRITICAL_RULES.includes(r.ruleId));
  const isHypo      = rules.some((r: any) => r.ruleId === "DR005");
  const isEatingOut = rules.some((r: any) => r.ruleId === "HN010");

  // FIX: guard division by zero — if calorieTarget is 0, percentages would be NaN/Infinity
  const safeCals = calorieTarget > 0 ? calorieTarget : 1;
  const cPct = Math.max(5, Math.round(carbsTarget * 4 / safeCals * 100));
  const pPct = Math.max(5, Math.round(proteinTarget * 4 / safeCals * 100));
  const fPct = Math.max(5, 100 - cPct - pPct);

  const dietLabel = dietType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroGlow} />
          <View style={s.heroRow}>
            <View style={{ gap: 5 }}>
              <Text style={s.heroLabel}>TODAY'S DIET</Text>
              <Text style={s.h2}>{dietLabel} Day</Text>
            </View>
            <View style={{ gap: 5, alignItems: "flex-end" }}>
              {isAdjusted  && <Pill label="FBS Adjusted"  color="amber" />}
              {isCritical  && <Pill label="Critical"      color="rose"  />}
              {isHypo      && <Pill label="Hypo Protocol" color="rose"  />}
              {isEatingOut && <Pill label="Eating Out"    color="amber" />}
              {!isAdjusted && !isCritical && !isHypo && <Pill label="On track" color="teal" />}
            </View>
          </View>
        </View>

        {/* Doctor flag — urgent */}
        {doctorFlagRaised && (
          <View style={s.doctorFlag}>
            <Text style={s.flagIcon}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.flagTitle}>Doctor notified</Text>
              <Text style={s.flagBody}>{doctorFlagReason ?? "Your protocol requires physician review. Your doctor has been alerted."}</Text>
            </View>
          </View>
        )}

        {/* Reasoning */}
        <ReasoningBox text={reasoning} />

        {/* Macro bar */}
        <View style={s.macroWrap}>
          <View style={s.bar}>
            <View style={[s.barC, { flex: cPct }]} />
            <View style={[s.barP, { flex: pPct }]} />
            <View style={[s.barF, { flex: fPct }]} />
          </View>
          <View style={s.legend}>
            {[
              { dot: Colors.amber,  label: `Carbs ${carbsTarget}g` },
              { dot: Colors.teal,   label: `Protein ${proteinTarget}g` },
              { dot: Colors.blue,   label: `Fat ${fatTarget}g` },
            ].map(item => (
              <View key={item.label} style={s.legItem}>
                <View style={[s.legDot, { backgroundColor: item.dot }]} />
                <Text style={s.legText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionCap title="Meals — tap any card for quantities" />

        {meals.map((m, i) => (
          <MealCard
            key={i}
            slot={m.slot}
            item={m.item}
            isActive={m.slot === "breakfast"}
            adjustment={m.adjustments}
          />
        ))}

        {/* Daily totals */}
        <View style={s.totals}>
          <Text style={s.totalsLabel}>DAILY TOTALS</Text>
          <View style={s.totalsRow}>
            {[
              { val: calorieTarget,        lbl: "kcal" },
              { val: carbsTarget + "g",    lbl: "carbs" },
              { val: proteinTarget + "g",  lbl: "protein" },
              { val: fatTarget + "g",      lbl: "fat" },
            ].map(item => (
              <View key={item.lbl} style={s.totalItem}>
                <Text style={s.totalVal}>{item.val}</Text>
                <Text style={s.totalLbl}>{item.lbl}</Text>
              </View>
            ))}
          </View>
          <View style={s.waterRow}>
            <Text style={{ fontSize: 19 }}>💧</Text>
            <Text style={s.waterText}>
              Water target: <Text style={{ color: Colors.spring }}>
                {Math.round(waterTargetMl / 1000 * 10) / 10}L
              </Text>{" "}
              ({Math.round(waterTargetMl / 250)} glasses)
              {isAdjusted ? " — FBS elevated: extra hydration helps glucose clearance." : ""}
            </Text>
          </View>
        </View>

        {/* Supplement note */}
        {!!supplementNote && (
          <View style={s.suppNote}>
            <Text style={s.suppNoteLabel}>SUPPLEMENT REMINDER</Text>
            <Text style={s.suppNoteText}>{supplementNote}</Text>
          </View>
        )}

        {/* Rules fired — collapsed detail */}
        {rules.length > 0 && (
          <>
            <SectionCap title="Rules active today" />
            {rules.slice(0, 3).map((r: any, i: number) => (
              <View key={i} style={s.ruleRow}>
                <View style={[s.ruleDot, {
                  backgroundColor: (r.ruleId || '').includes("004") || (r.ruleId || '').includes("003")
                    ? Colors.rose : (r.ruleId || '').includes("001") ? Colors.amber : Colors.teal
                }]} />
                <Text style={s.ruleText}>{r.message}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.deep },
  empty:         { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl, paddingTop: 80 },
  emptyTitle:    { fontFamily: Typography.display, fontSize: 26, color: Colors.ink, marginBottom: 8, textAlign: "center" },
  emptyText:     { fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2, textAlign: "center", lineHeight: 28 },

  hero:          { padding: Spacing.xl, paddingBottom: Spacing.md, position: "relative" },
  // FIX: replaced inset:0 with explicit edges (inset not valid in RN)
  heroGlow:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,107,84,0.18)" },
  heroRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel:     { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2.5, color: Colors.teal },
  h2:            { fontFamily: Typography.display, fontSize: 28, color: Colors.ink, lineHeight: 36 },

  doctorFlag:    { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: "rgba(217,123,114,0.08)", borderWidth: 0.5, borderColor: "rgba(217,123,114,0.3)", borderRadius: Radii.lg, padding: 13, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  flagIcon:      { fontSize: 21 },
  flagTitle:     { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.rose, marginBottom: 3 },
  flagBody:      { fontFamily: Typography.sans, fontSize: 15, color: "rgba(217,123,114,0.8)", lineHeight: 21 },

  macroWrap:     { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  bar:           { flexDirection: "row", height: 5, borderRadius: 4, overflow: "hidden", gap: 2, marginBottom: 9 },
  barC:          { backgroundColor: Colors.amber, borderRadius: 3 },
  barP:          { backgroundColor: Colors.teal, borderRadius: 3 },
  barF:          { backgroundColor: Colors.blue, borderRadius: 3 },
  legend:        { flexDirection: "row", gap: 16 },
  legItem:       { flexDirection: "row", alignItems: "center", gap: 5 },
  legDot:        { width: 5, height: 5, borderRadius: 3 },
  legText:       { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2 },

  totals:        { marginHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.sm, backgroundColor: Colors.card2, borderRadius: Radii.lg, padding: 13, borderWidth: 0.5, borderColor: Colors.border2 },
  totalsLabel:   { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2.5, color: Colors.teal, marginBottom: 10 },
  totalsRow:     { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  totalItem:     { alignItems: "center" },
  totalVal:      { fontFamily: Typography.mono, fontSize: 22, color: Colors.spring, fontWeight: "500" },
  totalLbl:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 2 },
  waterRow:      { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 9, borderTopWidth: 0.5, borderTopColor: Colors.border },
  waterText:     { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, flex: 1, lineHeight: 21 },

  suppNote:      { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: "rgba(62,219,165,0.05)", borderRadius: Radii.md, padding: 12, borderWidth: 0.5, borderColor: Colors.border2 },
  suppNoteLabel: { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2, color: Colors.teal, marginBottom: 5 },
  suppNoteText:  { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, lineHeight: 22 },

  ruleRow:       { marginHorizontal: Spacing.lg, marginBottom: 5, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  ruleDot:       { width: 6, height: 6, borderRadius: 3, marginTop: 4, flexShrink: 0 },
  ruleText:      { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, flex: 1, lineHeight: 21 },
});
