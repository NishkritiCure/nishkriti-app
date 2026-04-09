import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { NishkritiLogo } from "../../components/NishkritiLogo";
import { NSlider } from "../../components/NSlider";
import type { PatientProfile, Condition } from "../../types";

// ── DATA ─────────────────────────────────────────────────────────
const CONDITIONS: { key: Condition; label: string; emoji: string }[] = [
  { key: "diabetes_t2",  label: "Type 2 Diabetes",   emoji: "🩸" },
  { key: "pre_diabetes", label: "Pre-diabetes / IR",  emoji: "📊" },
  { key: "pcos",         label: "PCOS",               emoji: "🌀" },
  { key: "hypothyroid",  label: "Hypothyroidism",     emoji: "🦋" },
  { key: "hypertension", label: "Hypertension",       emoji: "❤️" },
  { key: "obesity",      label: "Obesity / Weight",   emoji: "⚖️" },
  { key: "dyslipidemia", label: "High Cholesterol",   emoji: "💉" },
  { key: "fatty_liver",  label: "Fatty Liver",        emoji: "🫀" },
  { key: "gut_ibs",      label: "Gut / IBS",          emoji: "🌿" },
  { key: "menopause",    label: "Menopause",           emoji: "🌸" },
  { key: "gout",         label: "Uric Acid / Gout",   emoji: "🦵" },
  { key: "stress",       label: "Stress / Cortisol",  emoji: "🧠" },
  { key: "anaemia",      label: "Iron Deficiency",    emoji: "🔴" },
  { key: "osteoporosis", label: "Osteoporosis",       emoji: "🦴" },
  { key: "post_covid",   label: "Post-COVID",         emoji: "🫁" },
];

const DIET_PREFS = [
  { key: "non_veg", label: "Non-vegetarian" },
  { key: "veg",     label: "Vegetarian" },
  { key: "vegan",   label: "Vegan" },
  { key: "egg",     label: "Eggetarian" },
  { key: "jain",    label: "Jain" },
];

const EQUIPMENT = [
  { key: "dumbbells",       label: "Dumbbells" },
  { key: "resistance_bands",label: "Resistance bands" },
  { key: "gym_machines",    label: "Gym machines" },
  { key: "barbell",         label: "Barbell" },
  { key: "kettlebell",      label: "Kettlebell" },
  { key: "none",            label: "No equipment" },
];

const GOALS = [
  { key: "reverse_condition", label: "Reverse my condition" },
  { key: "lose_weight",       label: "Lose weight" },
  { key: "reduce_medication", label: "Reduce medication" },
  { key: "more_energy",       label: "More energy" },
  { key: "better_sleep",      label: "Better sleep" },
  { key: "manage_symptoms",   label: "Manage symptoms" },
];

const TOTAL_STEPS = 7;

// ── HELPERS ──────────────────────────────────────────────────────
const StepDots = ({ current }: { current: number }) => (
  <View style={s.stepDots}>
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <View key={i} style={[s.dot, i < current ? s.dotDone : i === current ? s.dotActive : s.dotNext]} />
    ))}
  </View>
);

const Q = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.question}>{children}</Text>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.hint}>{children}</Text>
);

const MultiChip = ({ options, selected, onToggle, max }: {
  options: { key: string; label: string; emoji?: string }[];
  selected: string[];
  onToggle: (k: string) => void;
  max?: number;
}) => (
  <View style={s.chipWrap}>
    {options.map(opt => {
      const on = selected.includes(opt.key);
      const disabled = !on && max !== undefined && selected.length >= max;
      return (
        <TouchableOpacity
          key={opt.key}
          style={[s.chip, on && s.chipOn, disabled && s.chipDisabled]}
          onPress={() => !disabled && onToggle(opt.key)}
          activeOpacity={0.8}
        >
          {opt.emoji ? <Text style={s.chipEmoji}>{opt.emoji}</Text> : null}
          <Text style={[s.chipText, on && s.chipTextOn]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const SingleChip = ({ options, selected, onSelect }: {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (k: string) => void;
}) => (
  <View style={s.chipWrap}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.key}
        style={[s.chip, selected === opt.key && s.chipOn]}
        onPress={() => onSelect(opt.key)}
        activeOpacity={0.8}
      >
        <Text style={[s.chipText, selected === opt.key && s.chipTextOn]}>{opt.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── SCREEN ───────────────────────────────────────────────────────
export const OnboardingScreen = () => {
  const nav = useNavigation<any>();
  const { setPatientProfile } = useAppStore();
  const [step, setStep] = useState(0);

  // Step 0 — basics
  const [name, setName]     = useState("");
  const [dob, setDob]       = useState("");
  const [sex, setSex]       = useState("male");
  const [height, setHeight] = useState(165);
  const [weight, setWeight] = useState(75);

  // Step 1 — conditions
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [primaryCondition, setPrimary] = useState<Condition | "">("");

  // Step 2 — medications
  const [meds, setMeds] = useState("");

  // Step 3 — diet
  const [dietPref, setDietPref] = useState("non_veg");
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");

  // Step 4 — workout
  const [equipment, setEquipment] = useState<string[]>(["dumbbells", "resistance_bands"]);
  const [workoutLocation, setWorkoutLocation] = useState("home");
  const [availableMinutes, setAvailableMinutes] = useState(45);

  // Step 5 — goals & baselines
  const [goals, setGoals] = useState<string[]>([]);
  const [baselineFbs, setBaselineFbs] = useState(0);
  const [baselineHba1c, setBaselineHba1c] = useState(0);

  // Step 6 — confirm
  const isValid = (step: number) => {
    if (step === 0) return name.trim().length > 1 && dob.length === 10;
    if (step === 1) return conditions.length > 0 && primaryCondition !== "";
    return true;
  };

  const toggle = (arr: any[], setArr: Function, key: string) => {
    setArr((prev: string[]) => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      // Auto-set primary condition when exactly one condition selected
      if (setArr === setConditions) {
        if (next.length === 1) setPrimary(next[0] as Condition);
        else if (next.length === 0) setPrimary("" as any);
      }
      return next;
    });
  };

  const submit = () => {
    const profile: PatientProfile = {
      id: `P_${Date.now()}`,
      name: name.trim(),
      dob,
      sex: sex as any,
      heightCm: height,
      weightKg: weight,
      conditions: conditions,
      primaryCondition: primaryCondition as Condition,
      medications: meds.split("\n").filter(Boolean).map(m => ({ name: m.trim(), dose: "", timing: "" })),
      dietPreference: dietPref as any,
      allergies: allergies.split(",").map(s => s.trim()).filter(Boolean),
      dislikedFoods: dislikes.split(",").map(s => s.trim()).filter(Boolean),
      cuisinePreference: ["North Indian", "Pan-Indian"],
      cookingSetup: "home",
      activityLevel: "sedentary",
      workoutEquipment: equipment as any, // FIX: string[] not assignable to equipment type
      workoutLocation: [workoutLocation as any],
      availableMinutes,
      preferredWorkoutTime: "morning",
      goals: goals,
      injuries: [],
      programmeStartDate: new Date().toISOString().split("T")[0],
      currentPhase: 1,
      assignedDietType: "low_carb",
      baselineFbs: baselineFbs || 0,
      baselineHba1c: baselineHba1c || undefined,
      baselineWeight: weight,
      baselineWaist: 0,
      baselineHip: 0,
    };
    setPatientProfile(profile);
    nav.navigate("Waiting");
  };

  const stepContent = [
    // ── STEP 0: BASICS ──────────────────────────────────────────
    <>
      <Q>What is your name?</Q>
      <TextInput
        style={s.textInput}
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        placeholderTextColor={Colors.ink3}
        autoCapitalize="words"
      />
      <Q>Date of birth</Q>
      <Hint>Format: YYYY-MM-DD (e.g. 1985-04-09)</Hint>
      <TextInput
        style={s.textInput}
        value={dob}
        onChangeText={setDob}
        placeholder="1985-04-09"
        placeholderTextColor={Colors.ink3}
        keyboardType="numeric"
        maxLength={10}
      />
      <Q>Sex</Q>
      <SingleChip
        options={[{ key: "male", label: "Male" }, { key: "female", label: "Female" }, { key: "other", label: "Other" }]}
        selected={sex}
        onSelect={setSex}
      />
      <Q>Height</Q>
      <View style={s.bigInput}>
        <Text style={s.bigVal}>{height}</Text>
        <Text style={s.bigUnit}>cm</Text>
      </View>
      <NSlider min={140} max={210} step={1} value={height} onValueChange={setHeight} />
      <Q>Current weight</Q>
      <View style={s.bigInput}>
        <Text style={s.bigVal}>{weight.toFixed(1)}</Text>
        <Text style={s.bigUnit}>kg</Text>
      </View>
      <NSlider min={40} max={200} step={0.5} value={weight} onValueChange={v => setWeight(Math.round(v * 2) / 2)} />
    </>,

    // ── STEP 1: CONDITIONS ───────────────────────────────────────
    <>
      <Q>What condition(s) are you managing?</Q>
      <Hint>Select all that apply</Hint>
      <MultiChip options={CONDITIONS} selected={conditions} onToggle={k => toggle(conditions, setConditions, k as Condition)} />
      {conditions.length > 1 && (
        <>
          {/* FIX: Q component does not accept style prop; use View wrapper */}
          <View style={{ marginTop: Spacing.lg }}>
            <Q>Which is your primary concern?</Q>
          </View>
          <SingleChip
            options={CONDITIONS.filter(c => conditions.includes(c.key))}
            selected={primaryCondition}
            onSelect={k => setPrimary(k as Condition)}
          />
        </>
      )}
      {/* Auto-select primary when only 1 condition is chosen — handled in toggle below */}
    </>,

    // ── STEP 2: MEDICATIONS ──────────────────────────────────────
    <>
      <Q>What medications are you currently taking?</Q>
      <Hint>One per line — name and dose (e.g. Metformin 500mg twice daily)</Hint>
      <TextInput
        style={[s.textInput, { minHeight: 120, textAlignVertical: "top" }]}
        value={meds}
        onChangeText={setMeds}
        placeholder={"Metformin 500mg twice daily\nThyroxine 50mcg once daily"}
        placeholderTextColor={Colors.ink3}
        multiline
      />
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          This helps Dr. Nishit avoid supplement interactions and calibrate your protocol safely.
          Your information is private and only visible to your physician.
        </Text>
      </View>
    </>,

    // ── STEP 3: DIET PREFERENCES ─────────────────────────────────
    <>
      <Q>What are your dietary preferences?</Q>
      <SingleChip options={DIET_PREFS} selected={dietPref} onSelect={setDietPref} />
      <Q>Any food allergies?</Q>
      <Hint>Comma-separated (e.g. peanuts, dairy)</Hint>
      <TextInput
        style={s.textInput}
        value={allergies}
        onChangeText={setAllergies}
        placeholder="peanuts, shellfish"
        placeholderTextColor={Colors.ink3}
      />
      <Q>Foods you dislike?</Q>
      <Hint>Helps us avoid putting food you hate in your plan</Hint>
      <TextInput
        style={s.textInput}
        value={dislikes}
        onChangeText={setDislikes}
        placeholder="bitter gourd, raw onion"
        placeholderTextColor={Colors.ink3}
      />
    </>,

    // ── STEP 4: WORKOUT ──────────────────────────────────────────
    <>
      <Q>Where do you exercise?</Q>
      <SingleChip
        options={[{ key: "home", label: "At home" }, { key: "gym", label: "Gym" }, { key: "outdoor", label: "Outdoor" }]}
        selected={workoutLocation}
        onSelect={setWorkoutLocation}
      />
      <Q>What equipment do you have?</Q>
      <MultiChip options={EQUIPMENT} selected={equipment} onToggle={k => toggle(equipment, setEquipment, k)} />
      <Q>Available time for workout</Q>
      <View style={s.bigInput}>
        <Text style={s.bigVal}>{availableMinutes}</Text>
        <Text style={s.bigUnit}>min / day</Text>
      </View>
      <NSlider min={15} max={90} step={5} value={availableMinutes} onValueChange={setAvailableMinutes} />
    </>,

    // ── STEP 5: GOALS & BASELINES ─────────────────────────────────
    <>
      <Q>What are your goals?</Q>
      <Hint>Select all that apply</Hint>
      <MultiChip options={GOALS} selected={goals} onToggle={k => toggle(goals, setGoals, k)} />
      {(conditions.includes("diabetes_t2") || conditions.includes("pre_diabetes")) && (
        <>
          <Q>Current fasting blood sugar (if known)</Q>
          <Hint>Leave at 0 if you don't have a recent reading</Hint>
          <View style={s.bigInput}>
            <Text style={s.bigVal}>{baselineFbs || "—"}</Text>
            <Text style={s.bigUnit}>mg/dL</Text>
          </View>
          <NSlider min={0} max={400} step={1} value={baselineFbs} onValueChange={setBaselineFbs} />
          <Q>HbA1c (if known)</Q>
          <View style={s.bigInput}>
            <Text style={s.bigVal}>{baselineHba1c > 0 ? baselineHba1c.toFixed(1) : "—"}</Text>
            <Text style={s.bigUnit}>%</Text>
          </View>
          <NSlider min={0} max={14} step={0.1} value={baselineHba1c} onValueChange={v => setBaselineHba1c(Math.round(v * 10) / 10)} />
        </>
      )}
    </>,

    // ── STEP 6: CONFIRM ──────────────────────────────────────────
    <>
      <View style={s.confirmCard}>
        <Text style={s.confirmLabel}>NAME</Text>
        <Text style={s.confirmVal}>{name}</Text>
      </View>
      <View style={s.confirmCard}>
        <Text style={s.confirmLabel}>CONDITIONS</Text>
        <Text style={s.confirmVal}>
          {conditions.map(c => CONDITIONS.find(x => x.key === c)?.label).join(" · ")}
        </Text>
      </View>
      <View style={s.confirmCard}>
        <Text style={s.confirmLabel}>DIET</Text>
        <Text style={s.confirmVal}>{DIET_PREFS.find(d => d.key === dietPref)?.label ?? dietPref}</Text>
      </View>
      <View style={s.confirmCard}>
        <Text style={s.confirmLabel}>WORKOUT</Text>
        <Text style={s.confirmVal}>{availableMinutes} min · {workoutLocation}</Text>
      </View>
      <View style={s.confirmCard}>
        <Text style={s.confirmLabel}>GOALS</Text>
        <Text style={s.confirmVal}>{goals.map(g => GOALS.find(x => x.key === g)?.label).join(" · ") || "—"}</Text>
      </View>
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          Your profile has been submitted. Dr. Nishit will review and build your personalised protocol within 24 hours. You'll receive a notification when your plan is ready.
        </Text>
      </View>
    </>,
  ];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={s.header}>
          {step > 0 ? (
            <TouchableOpacity onPress={() => setStep(s => s - 1)}>
              <Text style={s.back}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
          <View style={s.logoWrap}>
            <NishkritiLogo size={26} showPulse={false} />
          </View>
          <View style={{ width: 60 }} />
        </View>

        <StepDots current={step} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
          {stepContent[step]}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={[s.btn, !isValid(step) && s.btnDisabled]}
              onPress={() => isValid(step) && setStep(s => s + 1)}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btn} onPress={submit} activeOpacity={0.85}>
              <Text style={s.btnText}>Submit profile →</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.deep },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg, paddingBottom: Spacing.sm },
  back:       { fontFamily: Typography.sans, fontSize: 18, color: Colors.ink2 },
  logoWrap:   { alignItems: "center" },
  stepDots:   { flexDirection: "row", paddingHorizontal: Spacing.xl, gap: 6, marginBottom: Spacing.sm },
  dot:        { flex: 1, height: 2.5, borderRadius: 2 },
  dotDone:    { backgroundColor: Colors.teal },
  dotActive:  { backgroundColor: Colors.spring },
  dotNext:    { backgroundColor: "rgba(255,255,255,0.07)" },
  scroll:     { padding: Spacing.xl, paddingTop: Spacing.sm },
  stepLabel:  { fontFamily: Typography.mono, fontSize: 13, letterSpacing: 2, color: Colors.ink3, marginBottom: Spacing.md, textTransform: "uppercase" },
  question:   { fontFamily: Typography.display, fontSize: 22, color: Colors.ink, lineHeight: 32, marginBottom: 4, marginTop: Spacing.md },
  hint:       { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, marginBottom: Spacing.sm },
  textInput:  { backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: 14, fontFamily: Typography.sans, fontSize: 18, color: Colors.ink, marginBottom: Spacing.sm },
  bigInput:   { backgroundColor: Colors.card2, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border2, padding: Spacing.lg, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: Spacing.sm },
  bigVal:     { fontFamily: Typography.mono, fontSize: 46, color: Colors.spring, fontWeight: "500", letterSpacing: -1 },
  bigUnit:    { fontFamily: Typography.mono, fontSize: 17, color: Colors.ink2 },
  chipWrap:   { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.sm },
  chip:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 0.5, borderColor: Colors.border, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn:     { borderColor: Colors.border3, backgroundColor: "rgba(62,219,165,0.08)" },
  chipDisabled: { opacity: 0.35 },
  chipEmoji:  { fontSize: 19 },
  chipText:   { fontFamily: Typography.sans, fontSize: 17, color: Colors.ink2 },
  chipTextOn: { color: Colors.teal },
  infoBox:    { backgroundColor: Colors.card2, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border2, padding: Spacing.md, marginTop: Spacing.md },
  infoText:   { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, lineHeight: 22 },
  confirmCard:{ backgroundColor: Colors.card, borderRadius: Radii.md, padding: Spacing.md, borderWidth: 0.5, borderColor: Colors.border, marginBottom: 7 },
  confirmLabel: { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2.5, color: Colors.teal, marginBottom: 4 },
  confirmVal: { fontFamily: Typography.sans, fontSize: 17, color: Colors.ink, lineHeight: 24 },
  footer:     { padding: Spacing.lg, paddingBottom: Spacing.xl, borderTopWidth: 0.5, borderTopColor: Colors.border },
  btn:        { backgroundColor: Colors.teal, borderRadius: Radii.lg, paddingVertical: 15, alignItems: "center" },
  btnDisabled:{ backgroundColor: Colors.em, opacity: 0.5 },
  btnText:    { fontFamily: Typography.sansMed, fontSize: 19, color: Colors.deep, fontWeight: "600", letterSpacing: 0.3 },
});
