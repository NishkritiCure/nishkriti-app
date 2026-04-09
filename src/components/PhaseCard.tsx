
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Radii, Spacing } from "../theme";

interface Props {
  phase: number;
  name: string;
  progress: number; // 0–1
  currentDay: number;
  totalDays: number;
}

export const PhaseCard: React.FC<Props> = ({ phase, name, progress, currentDay, totalDays }) => (
  <View style={styles.card}>
    <View style={styles.shine} />
    <View style={styles.row}>
      <View>
        <Text style={styles.label}>PHASE {phase}</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.pillOn}><Text style={styles.pillText}>On track</Text></View>
    </View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
    <View style={styles.footer}>
      <Text style={styles.day}>Day {currentDay} of {totalDays}</Text>
      <Text style={styles.day}>{totalDays - currentDay} days left</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.card2, borderRadius: Radii.lg,
    borderWidth: 0.5, borderColor: Colors.border2,
    padding: 15, overflow: "hidden",
  },
  shine: {
    position: "absolute", top: 0, left: 16, right: 16, height: 1,
    backgroundColor: "rgba(62,219,165,0.28)",
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  label: { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2.5, color: Colors.teal, marginBottom: 4 },
  name: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.ink },
  pillOn: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    backgroundColor: "rgba(62,219,165,0.1)", borderWidth: 0.5, borderColor: "rgba(62,219,165,0.22)",
  },
  pillText: { fontFamily: Typography.mono, fontSize: 12, color: Colors.teal },
  track: { height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  fill: { height: "100%", backgroundColor: Colors.teal, borderRadius: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between" },
  day: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2 },
});
