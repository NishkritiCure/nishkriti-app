import type { Protocol } from "../../types";

export const OBESITY_PROTOCOL: Protocol = {
  condition: "obesity",
  phases: [
    {
      phase: 1, name: "Metabolic Switch", durationDays: 42,
      goal: "Create calorie deficit, shift to fat burning, reduce visceral fat, build muscle to raise RMR.",
      dietType: "calorie_deficit",
      calorieDeficit: 500,
      carbsTarget: 130, proteinTarget: 120, fatTarget: 55,
      workoutType: "Resistance + Cardio", workoutDays: 5,
      biomarkerTargets: [
        { name: "Weight", target: "0.5–0.75 kg/week", current: null },
        { name: "Waist", target: "↓ 1–2 cm per 30 days", current: null },
        { name: "WHR", target: "< 0.9 (M), < 0.85 (F)", current: null },
      ],
      advancementCriteria: "0.5 kg/week average for 6 weeks + adherence > 80%",
    },
    {
      phase: 2, name: "Recomposition", durationDays: 56,
      goal: "Protect muscle while losing fat. Increase protein. Maintain deficit sustainably.",
      dietType: "high_protein",
      calorieDeficit: 400,
      carbsTarget: 110, proteinTarget: 140, fatTarget: 55,
      workoutType: "Progressive Resistance", workoutDays: 5,
      biomarkerTargets: [
        { name: "Body fat %", target: "Reducing", current: null },
        { name: "Weight", target: "Steady 0.3–0.5 kg/week", current: null },
      ],
      advancementCriteria: "5% body weight lost + energy levels stable",
    },
  ],
  rules: [
    {
      id: "OB001", metric: "weight", condition: "On track — losing well",
      threshold: "Weight loss 0.3–0.75 kg in 7 days", forNDays: 7,
      dietAction: "Maintain current plan. Keep protein high to protect muscle.",
      workoutAction: "Maintain current split. Progressive overload: add small weight increments.",
      severity: "positive", notifyDoctor: false,
    },
    {
      id: "OB002", metric: "weight", condition: "Plateau — adapt",
      threshold: "Weight change < 0.3 kg for 14 days", forNDays: 14,
      dietAction: "Reduce carbs by 15g. Add a refeed day (1× per week: +200 kcal, primarily complex carbs). Use frozen carb technique for all starchy foods. Reduce processed foods.",
      workoutAction: "Add 20-min cardio after resistance sessions. Increase workout intensity — add one drop set per exercise.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "OB003", metric: "weight", condition: "Extended plateau — reset needed",
      threshold: "Weight change < 0.2 kg for 21 days", forNDays: 21,
      dietAction: "Full diet break: increase calories to maintenance for 5 days to reset leptin levels. Then return to deficit. Swap diet type to carb cycling.",
      workoutAction: "Change workout split entirely. Add HIIT 2× per week for metabolic boost.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "3-week plateau — review if calorie target is appropriate for current weight.",
    },
    {
      id: "OB004", metric: "weight", condition: "Too fast — muscle loss risk",
      threshold: "Weight loss > 1.2 kg in 7 days", forNDays: 7,
      dietAction: "Increase calories by 200. Ensure minimum 1.6g protein per kg body weight. Add a carb refeed day. Avoid further restriction.",
      workoutAction: "Prioritise strength training. Reduce cardio volume temporarily.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Rapid weight loss — at risk of muscle and bone loss. Review with physician.",
    },
    {
      id: "OB010", metric: "energy", condition: "Fatigue — deficit too aggressive",
      threshold: "Energy ≤ 2 for 3 days", forNDays: 3,
      dietAction: "Reduce calorie deficit by 200 kcal. Add complex carbs at breakfast and lunch. Ensure iron-rich foods — obesity often masks iron deficiency. Add B-vitamin rich foods.",
      workoutAction: "Reduce to 3 workout days this week. Walk instead of intense sessions.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "OB020", metric: "FBS", condition: "Insulin resistance pattern",
      threshold: "FBS 101–130 mg/dL for 3 days", forNDays: 3,
      dietAction: "Shift to low-carb approach. Prioritise protein and fibre. Reduce ultra-processed foods completely. Add berberine (with physician approval).",
      workoutAction: "Mandatory post-meal walk 15 min. Resistance training before cardio (improves insulin sensitivity more).",
      severity: "medium", notifyDoctor: false,
    },
  ],
};
