import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { NSlider } from "../../components/NSlider";
import { todayStr } from "../../utils";
import { submitCheckIn as submitCheckInSupabase } from "../../services/patientService";
import type { DailyCheckIn } from "../../types";

// FIX: detect demo mode to decide which backend to use
const IS_DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;

const STEPS = 5;
const ENERGY_OPTS = [
  { level:5 as const, icon:"⚡", label:"Full energy" },
  { level:4 as const, icon:"😊", label:"Good" },
  { level:3 as const, icon:"🙂", label:"Average" },
  { level:2 as const, icon:"😔", label:"Tired" },
  { level:1 as const, icon:"🛌", label:"Very low" },
];
const REQUEST_OPTS = [
  { key:"vegetarian",   label:"Vegetarian today" },
  { key:"eating_out",   label:"Eating out" },
  { key:"home_workout", label:"Home workout" },
  { key:"core_focus",   label:"Core focus" },
  { key:"travel",       label:"Travel day" },
  { key:"light_dinner", label:"Light dinner" },
];

export const CheckInScreen = () => {
  const nav = useNavigation<any>();
  const { patient, submitCheckIn } = useAppStore();
  const [step, setStep] = useState(0);
  const [fbs, setFbs]     = useState(120);
  const [weight, setWeight] = useState(patient.profile.weightKg);
  const [energy, setEnergy] = useState<1|2|3|4|5>(3);
  const [requests, setRequests] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const fbsColor = fbs > 180 ? Colors.rose : fbs > 130 ? Colors.amber : fbs > 100 ? Colors.amber : Colors.teal;
  const fbsNote = fbs > 250 ? "Critical — doctor will be notified immediately." :
    fbs > 180 ? "Significantly above target. Plan adjusted — reduced carbs, post-meal walks added." :
    fbs > 130 ? "Above target (70–100). Carbs will be reduced today." :
    fbs > 100 ? "Slightly above target. Monitoring closely." :
    fbs >= 70  ? "On target. Great work." : "Below safe minimum. Carbs will be increased today.";

  const toggleRequest = (key: string) =>
    setRequests(r => r.includes(key) ? r.filter(k => k !== key) : [...r, key]);

  const submit = async () => {
    const ci: DailyCheckIn = {
      id: `CI_${Date.now()}`,
      patientId: patient.profile.id,
      date: todayStr(),
      fbs, weight,
      energyLevel: energy,
      symptoms: [],
      adherenceYesterday: "mostly",
      requests: {
        dietType: requests.includes("vegetarian") ? "vegetarian" : null,
        eatingOut: requests.includes("eating_out"),
        workoutLocation: requests.includes("home_workout") ? "home" : undefined,
        workoutFocus: requests.includes("core_focus") ? "core" : "full body",
        travelDay: requests.includes("travel"),
      },
      messageForDoctor: message || undefined,
    };

    // FIX: use Supabase in production, mock store in demo
    if (IS_DEMO) {
      submitCheckIn(ci);
    } else {
      try {
        await submitCheckInSupabase(ci);
        // Also update local store so plan generation works
        submitCheckIn(ci);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to submit check-in.');
        return;
      }
    }
    nav.navigate("Plan");
  };

  const StepDots = () => (
    <View style={styles.stepTrack}>
      {Array.from({length:STEPS}).map((_,i) => (
        <View key={i} style={[styles.stepDot, i < step ? styles.done : i === step ? styles.active : styles.next]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s-1) : nav.goBack()}>
          <Text style={styles.back}>← {step === 0 ? "Cancel" : "Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Morning check-in</Text>
        <View style={{ width:64 }} />
      </View>
      <StepDots />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* STEP 0 — FBS */}
        {step === 0 && (
          <View style={styles.pad}>
            <Text style={styles.q}>What is your fasting blood sugar?</Text>
            <Text style={styles.hint}>Before any food or drink — same time daily</Text>
            <View style={styles.bigInput}>
              <Text style={[styles.bigVal, { color: fbsColor }]}>{fbs}</Text>
              <Text style={styles.bigUnit}>mg/dL</Text>
            </View>
            <NSlider min={40} max={400} step={1} value={fbs} onValueChange={setFbs} trackColor={fbsColor} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLbl}>40</Text>
              <Text style={styles.sliderLbl}>Target: 70–100</Text>
              <Text style={styles.sliderLbl}>400</Text>
            </View>
            <View style={[styles.fbsNote, { borderLeftColor: fbsColor }]}>
              <Text style={[styles.fbsNoteText, { color: fbsColor }]}>{fbsNote}</Text>
            </View>
          </View>
        )}

        {/* STEP 1 — WEIGHT */}
        {step === 1 && (
          <View style={styles.pad}>
            <Text style={styles.q}>What is your weight today?</Text>
            <Text style={styles.hint}>First thing in the morning, without clothes</Text>
            <View style={styles.bigInput}>
              <Text style={styles.bigVal}>{weight.toFixed(1)}</Text>
              <Text style={styles.bigUnit}>kg</Text>
            </View>
            <NSlider min={40} max={200} step={0.1} value={weight} onValueChange={v => setWeight(Math.round(v*10)/10)} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLbl}>40 kg</Text>
              <Text style={styles.sliderLbl}>200 kg</Text>
            </View>
          </View>
        )}

        {/* STEP 2 — ENERGY */}
        {step === 2 && (
          <View style={styles.pad}>
            <Text style={styles.q}>How are you feeling today?</Text>
            <Text style={styles.hint}>This adjusts your workout intensity</Text>
            <View style={styles.energyGrid}>
              {ENERGY_OPTS.map(opt => (
                <TouchableOpacity key={opt.level}
                  style={[styles.energyBtn, energy === opt.level && styles.energyOn]}
                  onPress={() => setEnergy(opt.level)}>
                  <Text style={styles.energyIco}>{opt.icon}</Text>
                  <Text style={[styles.energyLbl, energy === opt.level && { color: Colors.ink }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3 — REQUESTS */}
        {step === 3 && (
          <View style={styles.pad}>
            <Text style={styles.q}>Any special requests today?</Text>
            <Text style={styles.hint}>Tap to customise within your protocol</Text>
            <View style={styles.chips}>
              {REQUEST_OPTS.map(opt => (
                <TouchableOpacity key={opt.key}
                  style={[styles.chip, requests.includes(opt.key) && styles.chipOn]}
                  onPress={() => toggleRequest(opt.key)}>
                  <Text style={[styles.chipText, requests.includes(opt.key) && styles.chipTextOn]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4 — MESSAGE */}
        {step === 4 && (
          <View style={styles.pad}>
            <Text style={styles.q}>Anything to tell your team?</Text>
            <Text style={styles.hint}>Optional — goes directly to your doctor</Text>
            <TextInput
              style={styles.msgInput}
              multiline
              value={message}
              onChangeText={setMessage}
              placeholder="e.g. feeling more tired than usual this week..."
              placeholderTextColor={Colors.ink3}
            />
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => step < STEPS - 1 ? setStep(s => s+1) : submit()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{step < STEPS - 1 ? "Continue" : "Generate today's plan →"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex:1, backgroundColor:Colors.deep },
  header:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:Spacing.lg, borderBottomWidth:0.5, borderBottomColor:Colors.border },
  back:       { fontFamily:Typography.sans, fontSize:17, color:Colors.ink2, minWidth:60 },
  title:      { fontFamily:Typography.display, fontSize:21, color:Colors.ink },
  stepTrack:  { flexDirection:"row", paddingHorizontal:Spacing.xl, paddingTop:Spacing.sm, gap:6 },
  stepDot:    { flex:1, height:2.5, borderRadius:2 },
  done:       { backgroundColor:Colors.teal },
  active:     { backgroundColor:Colors.spring },
  next:       { backgroundColor:"rgba(255,255,255,0.07)" },
  scroll:     { flex:1 },
  pad:        { padding:Spacing.xl },
  q:          { fontFamily:Typography.display, fontSize:26, color:Colors.ink, lineHeight:36, marginBottom:4 },
  hint:       { fontFamily:Typography.sans, fontSize:15, color:Colors.ink2, marginBottom:Spacing.lg },
  bigInput:   { backgroundColor:Colors.card2, borderRadius:Radii.lg, borderWidth:0.5, borderColor:Colors.border2, padding:Spacing.lg, flexDirection:"row", alignItems:"baseline", justifyContent:"space-between", marginBottom:Spacing.sm },
  bigVal:     { fontFamily:Typography.mono, fontSize:50, color:Colors.spring, fontWeight:"500", letterSpacing:-1 },
  bigUnit:    { fontFamily:Typography.mono, fontSize:18, color:Colors.ink2 },
  sliderLabels: { flexDirection:"row", justifyContent:"space-between", marginTop:-8, marginBottom:Spacing.md },
  sliderLbl:  { fontFamily:Typography.mono, fontSize:12, color:Colors.ink3 },
  fbsNote:    { borderLeftWidth:2.5, borderRadius:4, padding:11, backgroundColor:"rgba(255,255,255,0.03)" },
  fbsNoteText:{ fontFamily:Typography.sans, fontSize:15, lineHeight:22 },
  energyGrid: { gap:Spacing.sm },
  energyBtn:  { flexDirection:"row", alignItems:"center", gap:14, backgroundColor:Colors.card, borderRadius:Radii.md, borderWidth:0.5, borderColor:Colors.border, padding:15 },
  energyOn:   { borderColor:Colors.border3, backgroundColor:"rgba(62,219,165,0.08)" },
  energyIco:  { fontSize:28 },
  energyLbl:  { fontFamily:Typography.sans, fontSize:18, color:Colors.ink2 },
  chips:      { flexDirection:"row", flexWrap:"wrap", gap:8 },
  chip:       { paddingHorizontal:14, paddingVertical:9, borderRadius:20, borderWidth:0.5, borderColor:Colors.border },
  chipOn:     { borderColor:Colors.border3, backgroundColor:"rgba(62,219,165,0.08)" },
  chipText:   { fontFamily:Typography.sans, fontSize:16, color:Colors.ink2 },
  chipTextOn: { color:Colors.teal },
  msgInput:   { backgroundColor:Colors.card2, borderRadius:Radii.md, borderWidth:0.5, borderColor:Colors.border2, padding:14, fontFamily:Typography.sans, fontSize:16, color:Colors.ink, lineHeight:24, minHeight:120, textAlignVertical:"top" },
  footer:     { padding:Spacing.lg, paddingBottom:Spacing.xl, backgroundColor:Colors.deep, borderTopWidth:0.5, borderTopColor:Colors.border },
  btn:        { backgroundColor:Colors.teal, borderRadius:Radii.lg, paddingVertical:15, alignItems:"center" },
  btnText:    { fontFamily:Typography.sansMed, fontSize:19, color:Colors.deep, fontWeight:"600", letterSpacing:0.3 },
});
