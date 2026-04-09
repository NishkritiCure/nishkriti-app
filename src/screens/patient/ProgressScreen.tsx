import React, { useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop, Rect } from "react-native-svg";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { SectionCap } from "../../components/SectionCap";
import { MetricCard } from "../../components/MetricCard";
import { daysBetween, calcBMI, bmiCategory } from "../../utils";

const { width } = Dimensions.get("window");
const CHART_W = width - Spacing.lg * 2 - 28;
const CHART_H = 90;

const FBSChart = ({ data }: { data: { fbs: number; date: string }[] }) => {
  if (data.length < 2) return null;
  const fbsVals = data.map(d => d.fbs);
  const min = Math.max(0, Math.min(...fbsVals) - 20);
  const max = Math.max(...fbsVals) + 20;
  const toX = (i: number) => (i / (data.length - 1)) * CHART_W;
  const toY = (v: number) => CHART_H - ((v - min) / (max - min)) * CHART_H;
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.fbs)}`).join(" ");
  const areaPath = `${linePath} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
  // target band Y positions
  const t100Y = toY(100);
  const t70Y  = toY(70);

  return (
    <Svg width={CHART_W} height={CHART_H + 4}>
      <Defs>
        <SvgGrad id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Colors.teal} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={Colors.teal} stopOpacity={0} />
        </SvgGrad>
      </Defs>
      {/* Target band */}
      <Rect
        x={0} y={Math.min(t70Y, t100Y)}
        width={CHART_W} height={Math.abs(t100Y - t70Y) + 1}
        fill="rgba(62,219,165,0.07)" rx={2}
      />
      {/* Area fill */}
      <Path d={areaPath} fill="url(#area)" />
      {/* Line */}
      <Path d={linePath} stroke={Colors.teal} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <Circle cx={toX(data.length - 1)} cy={toY(fbsVals[fbsVals.length - 1])} r={4} fill={Colors.teal} />
    </Svg>
  );
};

const WeightChart = ({ data }: { data: { weight: number; date: string }[] }) => {
  if (data.length < 2) return null;
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const toX = (i: number) => (i / (data.length - 1)) * CHART_W;
  const toY = (v: number) => CHART_H - ((v - min) / (max - min)) * CHART_H;
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.weight)}`).join(" ");
  const areaPath = `${linePath} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H + 4}>
      <Defs>
        <SvgGrad id="warea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Colors.blue} stopOpacity={0.15} />
          <Stop offset="100%" stopColor={Colors.blue} stopOpacity={0} />
        </SvgGrad>
      </Defs>
      <Path d={areaPath} fill="url(#warea)" />
      <Path d={linePath} stroke={Colors.blue} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={toX(data.length - 1)} cy={toY(vals[vals.length - 1])} r={4} fill={Colors.blue} />
    </Svg>
  );
};

// FIX: check if running against live Supabase (not demo mode)
const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;

export const ProgressScreen = () => {
  const { patient } = useAppStore();

  // FIX: refresh patient data from Supabase when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!IS_DEMO) {
        useAppStore.getState().loadPatientFromSupabase();
      }
    }, [])
  );

  const { profile, progress } = patient;
  const first  = progress[0];
  const latest = progress[progress.length - 1];
  const daysIn = daysBetween(profile.programmeStartDate, new Date().toISOString().split("T")[0]);
  const bmi    = calcBMI(latest?.weight || profile.weightKg, profile.heightCm);
  const bmiCat = bmiCategory(bmi);
  // FIX: filter out undefined/null/0 FBS values before averaging — don't treat missing data as 0
  const recentFBS = progress.slice(-7).filter(p => p.fbs != null && p.fbs > 0);
  const avg7FBS = recentFBS.length
    ? Math.round(recentFBS.reduce((s, p) => s + p.fbs, 0) / recentFBS.length)
    : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroGlow} />
          <Text style={s.lbl}>YOUR PROGRESS</Text>
          <Text style={s.h2}>
            Day {daysIn} · {profile.primaryCondition === "diabetes_t2" ? "Diabetes Reversal" : "Programme"}
          </Text>
          <Text style={s.sub}>
            Started {new Date(profile.programmeStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
            {" · "}Phase {profile.currentPhase} of 4
          </Text>
        </View>

        <SectionCap title="Key measurements" />
        <View style={s.grid2}>
          <MetricCard
            label="Body weight" value={latest?.weight ?? profile.weightKg} unit="kg"
            delta={first && latest ? `↓ ${(first.weight - latest.weight).toFixed(1)} kg total` : undefined}
            style={s.mc2}
          />
          <MetricCard
            // FIX: use baseline waist or "—" instead of hardcoded 88
            label="Waist" value={latest?.waist ?? profile.baselineWaist ?? '—'} unit="cm"
            delta={first?.waist && latest?.waist ? `↓ ${first.waist - latest.waist} cm` : undefined}
            style={s.mc2}
          />
          <MetricCard
            label="BMI (est.)" value={bmi} delta={bmiCat.label} deltaPositive={bmi < 25}
            style={s.mc2}
          />
          <MetricCard
            label="7-day avg FBS" value={avg7FBS} unit="mg/dL"
            delta={first && latest ? `↓ ${first.fbs - latest.fbs} from start` : undefined}
            style={s.mc2}
          />
        </View>

        {/* FBS Chart */}
        <SectionCap title="FBS trend — 30 days" />
        <View style={s.chartCard}>
          <View style={s.chartHead}>
            <View>
              <Text style={s.chartTitle}>Fasting blood sugar</Text>
              <Text style={s.chartSub}>Target: 70–100 mg/dL · {progress.length} measurements</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.chartBig}>{latest?.fbs ?? "–"}</Text>
              <Text style={s.chartUnit}>mg/dL today</Text>
            </View>
          </View>
          <FBSChart data={progress} />
          <View style={s.xAxis}>
            {["Start", ...progress.slice(1, -1).map((_, i) => `Wk ${i + 2}`), "Today"]
              .slice(0, 4).map((l, i) => <Text key={i} style={s.xLbl}>{l}</Text>)}
          </View>
          <Text style={s.chartNote}>Shaded band = target 70–100 mg/dL</Text>
        </View>

        {/* Weight Chart */}
        <SectionCap title="Weight trend" />
        <View style={s.chartCard}>
          <View style={s.chartHead}>
            <View>
              <Text style={s.chartTitle}>Body weight</Text>
              <Text style={s.chartSub}>Baseline: {first?.weight ?? profile.baselineWeight} kg</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[s.chartBig, { color: Colors.blue }]}>{latest?.weight ?? profile.weightKg}</Text>
              <Text style={s.chartUnit}>kg today</Text>
            </View>
          </View>
          <WeightChart data={progress} />
          <View style={s.xAxis}>
            {["Start", ...progress.slice(1, -1).map((_, i) => `Wk ${i + 2}`), "Today"]
              .slice(0, 4).map((l, i) => <Text key={i} style={s.xLbl}>{l}</Text>)}
          </View>
        </View>

        {/* Milestones */}
        <SectionCap title="Milestones" />
        {[
          { done: (first?.fbs ?? 0) - (latest?.fbs ?? 0) >= 10,  label: "FBS reduced by 10+ mg/dL" },
          { done: (latest?.fbs ?? 999) < 180,                     label: "FBS below 180 mg/dL" },
          { done: (latest?.fbs ?? 999) < 130,                     label: "FBS below 130 mg/dL" },
          { done: (latest?.fbs ?? 999) < 100,                     label: "FBS below 100 — reversal zone 🎯" },
          { done: (first?.weight ?? 999) - (latest?.weight ?? 999) >= 1, label: "1 kg lost" },
          { done: (first?.weight ?? 999) - (latest?.weight ?? 999) >= 3, label: "3 kg lost" },
          { done: (first?.weight ?? 999) - (latest?.weight ?? 999) >= 5, label: "5% body weight lost" },
        ].map((m, i) => (
          <View key={i} style={s.milestone}>
            <Text style={{ fontSize: 21 }}>{m.done ? "✅" : "⬜"}</Text>
            <Text style={[s.milestoneText, m.done && s.milestoneDone]}>{m.label}</Text>
          </View>
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.deep },
  hero:          { padding: Spacing.xl, paddingBottom: Spacing.md, position: "relative" },
  // FIX: replaced inset:0 with explicit edges (inset not valid in RN)
  heroGlow:      { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,107,84,0.14)" },
  lbl:           { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2.5, color: Colors.teal, marginBottom: 4 },
  h2:            { fontFamily: Typography.display, fontSize: 28, color: Colors.ink, lineHeight: 38 },
  sub:           { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 5 },
  grid2:         { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 4 },
  mc2:           { width: (width - Spacing.lg * 2 - 8) / 2 },
  chartCard:     { marginHorizontal: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  chartHead:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  chartTitle:    { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink },
  chartSub:      { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginTop: 2 },
  chartBig:      { fontFamily: Typography.mono, fontSize: 22, color: Colors.spring },
  chartUnit:     { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  xAxis:         { flexDirection: "row", justifyContent: "space-between", paddingTop: 6 },
  xLbl:          { fontFamily: Typography.mono, fontSize: 12, color: Colors.ink3 },
  chartNote:     { fontFamily: Typography.mono, fontSize: 12, color: "rgba(62,219,165,0.35)", marginTop: 5 },
  milestone:     { flexDirection: "row", alignItems: "center", gap: 11, marginHorizontal: Spacing.lg, marginBottom: 7, backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border, padding: 12 },
  milestoneText: { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2, flex: 1 },
  milestoneDone: { color: Colors.ink },
});
