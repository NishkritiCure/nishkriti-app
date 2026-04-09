
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { NishkritiLogo } from "../../components/NishkritiLogo";

export const WaitingScreen = () => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.wrap}>
      <NishkritiLogo size={70} showPulse />
      <Text style={styles.title}>Your healthcare concierge{"\n"}is at work</Text>
      <Text style={styles.sub}>Your physician is reviewing your profile and building a protocol designed precisely for your body, your condition, and your goals — not a generic template.</Text>
      {[
        { done:true,  active:false, text:"Profile complete and submitted" },
        { done:false, active:true,  text:"Physician reviewing your profile now" },
        { done:false, active:false, text:"Protocol being personalised to your condition" },
        { done:false, active:false, text:"Plan goes live — push notification sent" },
      ].map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={[styles.num, step.done && styles.numDone, step.active && styles.numActive]}>
            <Text style={[styles.numText, (step.done || step.active) && styles.numTextActive]}>
              {step.done ? "✓" : i + 1}
            </Text>
          </View>
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}
      <Text style={styles.deva}>निष्कृति — मूल कारण का निष्कर्षण</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.deep },
  wrap: { flex:1, padding:Spacing.xl, alignItems:"center", justifyContent:"center", gap:Spacing.md },
  title: {
    fontFamily:Typography.display, fontSize:28, color:Colors.ink,
    textAlign:"center", lineHeight:39,
  },
  sub: {
    fontFamily:Typography.sans, fontSize:16, color:Colors.ink2,
    textAlign:"center", lineHeight:24, maxWidth:380,
  },
  step: {
    flexDirection:"row", alignItems:"center", gap:12,
    backgroundColor:Colors.card, borderRadius:Radii.md,
    borderWidth:0.5, borderColor:Colors.border, padding:11, width:"100%",
  },
  num: {
    width:24, height:24, borderRadius:12, backgroundColor:Colors.card2,
    alignItems:"center", justifyContent:"center",
  },
  numDone: { backgroundColor:Colors.teal },
  numActive: { backgroundColor:"rgba(62,219,165,0.15)", borderWidth:0.5, borderColor:"rgba(62,219,165,0.3)" },
  numText: { fontFamily:Typography.mono, fontSize:14, color:Colors.ink3 },
  numTextActive: { color:Colors.teal },
  stepText: { fontFamily:Typography.sans, fontSize:15, color:Colors.ink2, flex:1 },
  deva: { fontFamily:Typography.deva, fontSize:17, color:"rgba(62,219,165,0.3)", textAlign:"center" },
});
