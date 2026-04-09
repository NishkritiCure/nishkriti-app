import type { Protocol } from "../../types";

export const HYPOTHYROID_PROTOCOL: Protocol = {
  condition: "hypothyroid",
  phases: [
    {
      phase: 1, name: "Metabolic Restoration", durationDays: 56,
      goal: "Optimise TSH to 0.5–2.0. Remove goitrogens. Correct nutrient deficiencies. Boost metabolic rate.",
      dietType: "anti_inflammatory",
      calorieDeficit: 200,
      carbsTarget: 120, proteinTarget: 100, fatTarget: 65,
      workoutType: "Resistance + Morning Walks", workoutDays: 5,
      biomarkerTargets: [
        { name: "TSH", target: "0.5–2.0 mIU/L (Nishkriti target)", current: null },
        { name: "T3 (Free)", target: "Normal range, upper half", current: null },
        { name: "Weight", target: "0.3–0.5 kg/week loss", current: null },
        { name: "Energy", target: "Score ≥ 3/5 daily", current: null },
      ],
      advancementCriteria: "TSH in 0.5–2.0 range + weight reducing + energy consistently ≥ 3",
    },
    {
      phase: 2, name: "Nutrient Optimisation", durationDays: 56,
      goal: "Selenium, iodine, zinc, iron correction. Gut health for T4→T3 conversion. Sustained weight loss.",
      dietType: "high_probiotic",
      calorieDeficit: 300,
      carbsTarget: 110, proteinTarget: 110, fatTarget: 65,
      workoutType: "Resistance + Cardio", workoutDays: 5,
      biomarkerTargets: [
        { name: "TSH", target: "0.5–2.0 mIU/L", current: null },
        { name: "Selenium", target: "Adequate dietary intake", current: null },
      ],
      advancementCriteria: "Stable TSH + 3% body weight lost + energy consistently good",
    },
  ],
  rules: [
    // ── TSH RULES ─────────────────────────────────────────────────
    {
      id: "HT001", metric: "TSH", condition: "TSH above Nishkriti target",
      threshold: "TSH 2.1–4.5 mIU/L (lab normal but not optimal)", forNDays: 1,
      dietAction: "Increase selenium foods: Brazil nuts (2/day), sunflower seeds. Ensure adequate iodine (seaweed, iodised salt — not excessive). Remove raw goitrogens — no raw cabbage, broccoli, kale (cooked fine). Add gut probiotics daily.",
      workoutAction: "Morning walk 20–30 min before breakfast to boost metabolic rate. Resistance training 3× this week.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "TSH 2.1–4.5 — above Nishkriti optimal target of 0.5–2.0. Review thyroid medication dose.",
    },
    {
      id: "HT002", metric: "TSH", condition: "TSH elevated — hypothyroid pattern",
      threshold: "TSH > 4.5 mIU/L", forNDays: 1,
      dietAction: "Strict goitrogen removal. Anti-inflammatory protocol. Selenium + zinc + iron focus. Remove soy completely. No raw cruciferous vegetables.",
      workoutAction: "Light resistance only. Morning walk mandatory. No intense cardio — increases cortisol which impairs conversion.",
      severity: "high", notifyDoctor: true,
      notifyReason: "TSH > 4.5 — clinical hypothyroidism range. Medication review urgent.",
    },
    {
      id: "HT003", metric: "TSH", condition: "TSH optimal",
      threshold: "TSH 0.5–2.0 mIU/L for 14 days", forNDays: 14,
      dietAction: "Maintain current protocol. Gentle reintroduction of cooked cruciferous vegetables. Continue selenium foods.",
      workoutAction: "Increase exercise intensity progressively. Add one HIIT session per week.",
      severity: "positive", notifyDoctor: false,
    },
    // ── ENERGY / FATIGUE ──────────────────────────────────────────
    {
      id: "HT010", metric: "energy", condition: "Hypothyroid fatigue",
      threshold: "Energy ≤ 2 for 3 days", forNDays: 3,
      dietAction: "Increase complex carbs by 30g (hypothyroid patients need more carbs than keto protocols). Add iron-rich foods. Add Ashwagandha (physician approval). Ensure adequate calories — do not restrict too heavily.",
      workoutAction: "Reduce workout to 20 min. Focus on light resistance. Prioritise sleep over exercise for this week.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Persistent fatigue in hypothyroid patient — may indicate suboptimal T3 levels or iron deficiency.",
    },
    {
      id: "HT011", metric: "energy", condition: "Good energy — thyroid improving",
      threshold: "Energy ≥ 4 for 7 consecutive days", forNDays: 7,
      dietAction: "Excellent sign of improving thyroid function. Can slightly increase calorie deficit. Continue selenium and iodine focus.",
      workoutAction: "Increase workout duration by 10 min. Add one extra strength session this week.",
      severity: "positive", notifyDoctor: false,
    },
    // ── WEIGHT RULES ──────────────────────────────────────────────
    {
      id: "HT020", metric: "weight", condition: "Hypothyroid weight plateau",
      threshold: "Weight change < 0.2 kg for 21 days", forNDays: 21,
      dietAction: "Hypothyroid patients often plateau. Do not restrict calories further. Instead: switch to carb cycling — high carb 2 days, low carb 5 days. Add metabolic reset day (higher carbs, lower fat). Focus on gut health.",
      workoutAction: "Add morning walk immediately on waking (before thyroxine takes effect). Increase resistance training frequency.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Extended weight plateau in hypothyroid patient — review TSH and consider thyroid medication adjustment.",
    },
    // ── SLEEP ─────────────────────────────────────────────────────
    {
      id: "HT030", metric: "sleep", condition: "Poor sleep — thyroid disruptor",
      threshold: "Sleep < 6 hours for 3 days", forNDays: 3,
      dietAction: "Add magnesium glycinate at bedtime. Tart cherry concentrate (natural melatonin). No screens 1 hour before bed. No caffeine after 12pm. Warm turmeric milk at bedtime.",
      workoutAction: "Move workout to morning. Avoid evening exercise. Add 10-min evening yoga or stretching.",
      severity: "medium", notifyDoctor: false,
    },
    // ── MEDICATION TIMING ─────────────────────────────────────────
    {
      id: "HT040", metric: "medication", condition: "Thyroxine timing check",
      threshold: "Daily reminder", forNDays: 1,
      dietAction: "Take thyroxine 30–60 min before breakfast on empty stomach. Avoid calcium, iron, and coffee within 4 hours of thyroxine. Do not take with methi water or cinnamon (absorption interference).",
      workoutAction: "Walk after thyroxine is taken, not before — allows medication to start working.",
      severity: "low", notifyDoctor: false,
    },
  ],
};
