
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { todayStr } from "../../utils";

type Urgency = "urgent" | "question" | "medication" | "change" | null;

const URGENCY_OPTS = [
  { key:"urgent" as const, icon:"🚨", label:"Urgent —\nnot feeling well" },
  { key:"question" as const, icon:"❓", label:"Question about\nmy plan" },
  { key:"medication" as const, icon:"💊", label:"Medication\nconcern" },
  { key:"change" as const, icon:"🔄", label:"Request a\nplan change" },
];

export const NotifyDoctorScreen = () => {
  const { patient } = useAppStore();
  const [urgency, setUrgency] = useState<Urgency>(null);
  const [message, setMessage] = useState("");
  const todayCI = patient.checkIns.find(c => c.date === todayStr());

  const send = () => {
    if (!urgency) { Alert.alert("Please select a category first."); return; }
    Alert.alert(
      "Message sent",
      urgency === "urgent" ? "Your team has been notified urgently. If you are experiencing chest pain, breathing difficulty, or blood sugar above 300 mg/dL — go to the nearest emergency immediately." : "Your message has been sent. Your team will respond within 4 hours.",
      [{ text:"OK" }]
    );
    setMessage("");
    setUrgency(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notify your team</Text>
          <Text style={styles.sub}>Your vitals from today are attached automatically</Text>
        </View>

        {/* Urgency */}
        <View style={styles.ugGrid}>
          {URGENCY_OPTS.map(opt => (
            <TouchableOpacity key={opt.key}
              style={[styles.ugBtn,
                urgency === opt.key && opt.key === "urgent" && styles.ugSelRed,
                urgency === opt.key && opt.key !== "urgent" && styles.ugSelTeal,
              ]}
              onPress={() => setUrgency(opt.key)}>
              <Text style={styles.ugIco}>{opt.icon}</Text>
              <Text style={styles.ugLbl}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vitals */}
        {todayCI && (
          <View style={styles.vitals}>
            <Text style={styles.vitalsLabel}>VITALS ATTACHED TODAY</Text>
            <View style={styles.vitalsRow}>
              <Text style={styles.vItem}>FBS <Text style={styles.vVal}>{todayCI.fbs}</Text></Text>
              <Text style={styles.vItem}>Wt <Text style={styles.vVal}>{todayCI.weight} kg</Text></Text>
              <Text style={styles.vItem}>Energy <Text style={styles.vVal}>{todayCI.energyLevel}/5</Text></Text>
            </View>
          </View>
        )}

        {/* Message */}
        <TextInput
          style={styles.input}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder="Describe what's happening..."
          placeholderTextColor={Colors.ink3}
        />

        {/* Emergency note */}
        {urgency === "urgent" && (
          <View style={styles.emergency}>
            <Text style={styles.emergencyIco}>⚠</Text>
            <Text style={styles.emergencyText}>
              If you have chest pain, difficulty breathing, or blood sugar above 300 mg/dL — go to the nearest emergency immediately. Your team has been notified.
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, urgency === "urgent" && styles.btnUrgent]} onPress={send}>
          <Text style={styles.btnText}>
            {urgency === "urgent" ? "Send urgent message" : "Send to team"}
          </Text>
        </TouchableOpacity>

        <View style={{ height:Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.deep },
  header: { padding:Spacing.xl, paddingBottom:Spacing.md },
  title: { fontFamily:Typography.display, fontSize:28, color:Colors.ink, lineHeight:36 },
  sub: { fontFamily:Typography.sans, fontSize:15, color:Colors.ink2, marginTop:4 },
  ugGrid: { flexDirection:"row", flexWrap:"wrap", gap:8, paddingHorizontal:Spacing.lg, marginBottom:Spacing.md },
  ugBtn: {
    width:"47%", backgroundColor:Colors.card, borderRadius:Radii.lg,
    borderWidth:0.5, borderColor:Colors.border, padding:14, alignItems:"center",
  },
  ugSelRed: { borderColor:"rgba(217,123,114,0.35)", backgroundColor:"rgba(217,123,114,0.06)" },
  ugSelTeal: { borderColor:Colors.border3, backgroundColor:"rgba(62,219,165,0.06)" },
  ugIco: { fontSize:28, marginBottom:6 },
  ugLbl: { fontFamily:Typography.sans, fontSize:15, color:Colors.ink2, textAlign:"center", lineHeight:21 },
  vitals: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.sm,
    backgroundColor:Colors.card2, borderRadius:Radii.md,
    borderWidth:0.5, borderColor:Colors.border2, padding:11,
  },
  vitalsLabel: { fontFamily:Typography.mono, fontSize:12, letterSpacing:2.5, color:Colors.teal, marginBottom:7 },
  vitalsRow: { flexDirection:"row", gap:18 },
  vItem: { fontFamily:Typography.mono, fontSize:15, color:Colors.ink2 },
  vVal: { color:Colors.spring },
  input: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.sm,
    backgroundColor:Colors.card2, borderRadius:Radii.md,
    borderWidth:0.5, borderColor:Colors.border2,
    padding:14, fontFamily:Typography.sans, fontSize:16, color:Colors.ink,
    lineHeight:24, minHeight:80, textAlignVertical:"top",
  },
  emergency: {
    marginHorizontal:Spacing.lg, marginBottom:Spacing.sm,
    backgroundColor:"rgba(217,123,114,0.05)", borderRadius:Radii.md,
    borderWidth:0.5, borderColor:"rgba(217,123,114,0.2)",
    padding:12, flexDirection:"row", gap:9, alignItems:"flex-start",
  },
  emergencyIco: { fontSize:21, color:Colors.rose },
  emergencyText: { fontFamily:Typography.sans, fontSize:15, color:"rgba(217,123,114,0.85)", flex:1, lineHeight:21 },
  btn: {
    marginHorizontal:Spacing.lg, backgroundColor:Colors.teal,
    borderRadius:Radii.lg, paddingVertical:15, alignItems:"center",
  },
  btnUrgent: { backgroundColor:Colors.rose },
  btnText: { fontFamily:Typography.sansMed, fontSize:19, color:Colors.deep, fontWeight:"600" },
});
