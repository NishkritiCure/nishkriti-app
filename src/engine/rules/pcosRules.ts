import type { Protocol } from "../../types";

export const PCOS_PROTOCOL: Protocol = {
  condition: "pcos",
  phases: [
    {
      phase: 1, name: "Insulin Reset", durationDays: 42,
      goal: "Break the insulin resistance driving PCOS. Regulate blood sugar. Reduce androgens.",
      dietType: "carb_cycling",
      calorieDeficit: 350,
      carbsTarget: 80, proteinTarget: 100, fatTarget: 60,
      workoutType: "Resistance + HIIT", workoutDays: 5,
      biomarkerTargets: [
        { name: "FBS", target: "70–100 mg/dL", current: null },
        { name: "Fasting Insulin", target: "< 12 μIU/mL", current: null },
        { name: "LH:FSH Ratio", target: "< 2:1", current: null },
        { name: "Waist", target: "< 80 cm", current: null },
      ],
      advancementCriteria: "Cycle regularity improving + fasting insulin < 15 + weight reducing",
    },
    {
      phase: 2, name: "Hormonal Repair", durationDays: 42,
      goal: "Restore LH:FSH ratio, reduce testosterone, resume ovulation.",
      dietType: "anti_inflammatory",
      calorieDeficit: 250,
      carbsTarget: 100, proteinTarget: 110, fatTarget: 65,
      workoutType: "Resistance + Yoga", workoutDays: 5,
      biomarkerTargets: [
        { name: "LH:FSH", target: "< 2:1", current: null },
        { name: "Testosterone (free)", target: "Normal range", current: null },
        { name: "Cycle length", target: "21–35 days", current: null },
      ],
      advancementCriteria: "Regular cycle ≥ 2 consecutive months + insulin < 10",
    },
  ],
  rules: [
    // ── INSULIN / FBS RULES ──────────────────────────────────────
    {
      id: "PC001", metric: "FBS", condition: "Amber — insulin resistance active",
      threshold: "FBS 101–130 mg/dL", forNDays: 3,
      dietAction: "Reduce refined carbs. Increase fibre and protein. Add cinnamon and methi daily.",
      workoutAction: "Add 20-min post-lunch walk. Prioritise strength training over cardio.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "PC002", metric: "FBS", condition: "Elevated — act",
      threshold: "FBS 131–180 mg/dL", forNDays: 2,
      dietAction: "Switch to strict low-carb day. Remove all sugar and fruit. Add berberine at meals.",
      workoutAction: "30-min post-meal walk mandatory. Reduce HIIT intensity.",
      severity: "high", notifyDoctor: false,
    },
    {
      id: "PC003", metric: "FBS", condition: "Critical for PCOS",
      threshold: "FBS above 180 mg/dL", forNDays: 1,
      dietAction: "Keto protocol today. Notify doctor. Only protein + fat + non-starchy vegetables.",
      workoutAction: "Walking only. No intense exercise.",
      severity: "critical", notifyDoctor: true,
      notifyReason: "FBS > 180 in PCOS — significant insulin resistance. Metformin review needed.",
    },
    // ── CYCLE TRACKING RULES ──────────────────────────────────────
    {
      id: "PC010", metric: "cycle", condition: "Cycle late > 40 days",
      threshold: "Cycle absent for 40+ days", forNDays: 40,
      dietAction: "Increase zinc-rich foods (pumpkin seeds, chickpeas). Add vitamin E. Reduce soy.",
      workoutAction: "Add 20-min morning yoga or stretching. Reduce HIIT frequency to 2× per week.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Cycle absent > 40 days — review hormonal response to protocol.",
    },
    {
      id: "PC011", metric: "cycle", condition: "Cycle improving",
      threshold: "Cycle length 21–38 days for 2 consecutive months", forNDays: 60,
      dietAction: "Maintain current approach. Add seed cycling — flaxseed + pumpkin (follicular), sunflower + sesame (luteal).",
      workoutAction: "Continue current plan. Reduce intensity in days 1–3 of cycle.",
      severity: "positive", notifyDoctor: false,
    },
    // ── WEIGHT RULES ──────────────────────────────────────────────
    {
      id: "PC020", metric: "weight", condition: "Plateau — PCOS-specific",
      threshold: "Weight change < 0.3 kg for 21 days", forNDays: 21,
      dietAction: "Introduce structured carb cycling: 2 high-carb days (training days), 5 low-carb days. Add refeed day.",
      workoutAction: "Add one extra strength session. Increase post-meal walks.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "PC021", metric: "weight", condition: "Rapid loss",
      threshold: "Weight loss > 1 kg in 7 days", forNDays: 7,
      dietAction: "Slow down. Increase calories by 200. Add complex carbs at dinner. Prioritise sleep nutrition.",
      workoutAction: "Reduce intensity for this week. Prioritise recovery.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Rapid weight loss in PCOS can trigger hormonal disruption — review calorie target.",
    },
    // ── ENERGY RULES ──────────────────────────────────────────────
    {
      id: "PC030", metric: "energy", condition: "Fatigue — PCOS pattern",
      threshold: "Energy ≤ 2 for 3 consecutive days", forNDays: 3,
      dietAction: "Increase complex carbs by 20g. Add iron-rich foods: spinach, lentils, sesame. Check B12 intake.",
      workoutAction: "Replace HIIT with yoga or light resistance. Add 10-min morning walk for cortisol reset.",
      severity: "medium", notifyDoctor: false,
    },
    // ── ADHERENCE ──────────────────────────────────────────────────
    {
      id: "PC040", metric: "adherence", condition: "Consistent adherence",
      threshold: "Adherence > 80% for 21 days", forNDays: 21,
      dietAction: "Allow one flexible meal per week. Introduce seed cycling if not already doing it.",
      workoutAction: "Add HIIT 2× per week if energy allows.",
      severity: "positive", notifyDoctor: false,
    },
  ],
};
