import type { Protocol } from "../../types";

export const HYPERTENSION_PROTOCOL: Protocol = {
  condition: "hypertension",
  phases: [
    {
      phase: 1, name: "Pressure Drop", durationDays: 42,
      goal: "Reduce SBP to 100–125 mmHg without medication if possible. Reduce sodium, increase potassium. DASH-style approach.",
      dietType: "anti_inflammatory",
      calorieDeficit: 350,
      carbsTarget: 130, proteinTarget: 90, fatTarget: 55,
      workoutType: "Cardio + Resistance (moderate)", workoutDays: 5,
      biomarkerTargets: [
        { name: "SBP", target: "100–125 mmHg (Nishkriti target)", current: null },
        { name: "DBP", target: "60–80 mmHg", current: null },
        { name: "Weight", target: "Reduce 0.3–0.5 kg/week", current: null },
        { name: "Waist", target: "< 90 cm (M), < 80 cm (F)", current: null },
      ],
      advancementCriteria: "SBP consistently 100–130 for 14 days + weight reducing",
    },
  ],
  rules: [
    // ── BP RULES ──────────────────────────────────────────────────
    {
      id: "HN001", metric: "BP", condition: "BP above Nishkriti target",
      threshold: "SBP 126–140 mmHg", forNDays: 3,
      dietAction: "Strict sodium reduction: no added salt, no pickles, no papad, no processed food. Increase potassium: banana, coconut water, sweet potato, spinach. Add hibiscus tea (1–2 cups). Add flaxseeds (2 tbsp/day). Reduce caffeine to 1 cup max.",
      workoutAction: "Add 30-min morning brisk walk. Avoid weight lifting with breath-holding (Valsalva). Focus on moderate resistance, never to failure.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "HN002", metric: "BP", condition: "BP significantly elevated",
      threshold: "SBP 141–160 mmHg", forNDays: 2,
      dietAction: "DASH protocol immediately. Maximum sodium 1500mg/day. Only home-cooked food. No restaurant meals. No red meat for this week. Add beet root juice (one glass). Celery 4 stalks daily.",
      workoutAction: "No heavy lifting. Walking and light yoga only. Breathing exercises: 4-7-8 breathing technique, 10 min daily.",
      severity: "high", notifyDoctor: true,
      notifyReason: "SBP 141–160 for 2+ days — medication review required. Current protocol may be insufficient.",
    },
    {
      id: "HN003", metric: "BP", condition: "Hypertensive — critical",
      threshold: "SBP > 160 mmHg", forNDays: 1,
      dietAction: "Suspend all protocol changes. Supportive only. No salt whatsoever. No stimulants. Rest completely.",
      workoutAction: "Suspend all exercise. Rest. If symptoms (headache, vision changes, chest pain) — emergency immediately.",
      severity: "critical", notifyDoctor: true,
      notifyReason: "SBP > 160 — hypertensive urgency. Emergency review. Ensure patient has emergency contacts and medication.",
    },
    {
      id: "HN004", metric: "BP", condition: "BP on target",
      threshold: "SBP 100–125 for 14 days", forNDays: 14,
      dietAction: "Excellent control. Maintain current sodium restriction. Continue potassium-rich foods. Can slightly relax to occasional restaurant meal — choose wisely.",
      workoutAction: "Can progressively increase intensity. Add interval training 2× per week.",
      severity: "positive", notifyDoctor: false,
    },
    // ── SODIUM TRACKING ───────────────────────────────────────────
    {
      id: "HN010", metric: "diet", condition: "Eating out day — BP risk",
      threshold: "Eating out flagged in check-in", forNDays: 1,
      dietAction: "When eating out: request no salt, no MSG, no sauces. Choose grilled/steamed over fried. Roti over rice. Dal over curries. Avoid pickles/chutneys with salt. Drink coconut water after meal. No alcohol.",
      workoutAction: "Add extra 15-min walk after the restaurant meal to aid BP management.",
      severity: "medium", notifyDoctor: false,
    },
    // ── STRESS LINK ───────────────────────────────────────────────
    {
      id: "HN020", metric: "energy", condition: "Low energy + hypertension — stress link",
      threshold: "Energy ≤ 2 for 3 days", forNDays: 3,
      dietAction: "Add magnesium-rich foods: dark chocolate (10g, 85%), pumpkin seeds, spinach. Reduce caffeine completely. Chamomile tea before bed. Ensure adequate protein — low protein increases cortisol.",
      workoutAction: "Replace intense workouts with yoga and breathing exercises this week. Add 20-min nap if possible.",
      severity: "medium", notifyDoctor: true,
      notifyReason: "Fatigue with hypertension may indicate cortisol dysregulation or medication side effect. Review.",
    },
    // ── WEIGHT / BP LINK ─────────────────────────────────────────
    {
      id: "HN030", metric: "weight", condition: "Weight reducing — BP improving",
      threshold: "Weight loss ≥ 2 kg in 30 days", forNDays: 30,
      dietAction: "Continue current approach. Each 1 kg of weight loss typically reduces SBP by 1–2 mmHg. On target.",
      workoutAction: "Maintain current plan. Celebrate the progress.",
      severity: "positive", notifyDoctor: false,
    },
  ],
};
