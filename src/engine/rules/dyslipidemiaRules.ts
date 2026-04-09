import type { Protocol } from "../../types";

export const DYSLIPIDEMIA_PROTOCOL: Protocol = {
  condition: "dyslipidemia",
  phases: [
    {
      phase: 1, name: "Lipid Reset", durationDays: 84,
      goal: "Reduce LDL, raise HDL, lower triglycerides through diet and exercise. Avoid medication if possible.",
      dietType: "anti_inflammatory",
      calorieDeficit: 300,
      carbsTarget: 100, proteinTarget: 100, fatTarget: 70,
      workoutType: "Cardio + Resistance", workoutDays: 5,
      biomarkerTargets: [
        { name: "LDL", target: "< 100 mg/dL", current: null },
        { name: "HDL", target: "> 50 mg/dL (M), > 60 mg/dL (F)", current: null },
        { name: "Triglycerides", target: "< 150 mg/dL", current: null },
        { name: "Total Cholesterol", target: "< 200 mg/dL", current: null },
      ],
      advancementCriteria: "LDL < 130 + Triglycerides < 200 + good dietary adherence",
    },
  ],
  rules: [
    {
      id: "DL001", metric: "diet", condition: "High triglycerides — carb trigger",
      threshold: "Triglycerides > 200 mg/dL", forNDays: 1,
      dietAction: "Drastically reduce refined carbs and sugar — the primary driver of high triglycerides. No refined flour (maida), no sugar, no fruit juice, no alcohol. Increase omega-3: fatty fish 3×/week or supplement. Add flaxseed (2 tbsp/day). Use only olive oil and ghee.",
      workoutAction: "Cardio is most effective for lowering triglycerides: 30–45 min brisk walk or cycle 5× per week.",
      severity: "high", notifyDoctor: true,
      notifyReason: "Triglycerides > 200 — dietary intervention priority. Lab recheck in 8 weeks.",
    },
    {
      id: "DL002", metric: "diet", condition: "High LDL — saturated fat pattern",
      threshold: "LDL > 130 mg/dL", forNDays: 1,
      dietAction: "Reduce saturated fat: limit dairy, red meat, coconut oil. Increase soluble fibre: oats, psyllium husk (1 tbsp/day), beans, apples. Add plant sterols: 2g/day from fortified foods. Increase nuts (walnuts, almonds 30g/day).",
      workoutAction: "Exercise raises HDL: minimum 30 min moderate cardio 5 days/week. Morning walk before breakfast particularly effective.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "DL003", metric: "diet", condition: "Low HDL — inflammation pattern",
      threshold: "HDL < 40 mg/dL", forNDays: 1,
      dietAction: "Increase healthy fats: avocado, olive oil, nuts. Reduce trans fats and ultra-processed food completely. Add turmeric + black pepper daily. Increase fibre to 35g/day.",
      workoutAction: "Resistance training 3× per week specifically raises HDL. Add HIIT 2× per week if possible.",
      severity: "medium", notifyDoctor: false,
    },
    {
      id: "DL010", metric: "weight", condition: "Weight loss improving lipids",
      threshold: "Weight loss ≥ 3 kg in 30 days", forNDays: 30,
      dietAction: "Excellent — each kg of weight lost improves lipid profile. Maintain current approach. Can gradually increase healthy fats.",
      workoutAction: "Maintain current plan. Progressive improvement in cardio capacity.",
      severity: "positive", notifyDoctor: false,
    },
  ],
};
