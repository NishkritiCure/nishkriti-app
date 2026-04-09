
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Typography, Radii, Spacing } from "../theme";
import type { ExerciseItem } from "../types";

interface Props {
  item: ExerciseItem;
  done?: boolean;
  onToggleDone?: () => void;
}

export const ExerciseCard: React.FC<Props> = ({ item, done, onToggleDone }) => (
  <View style={styles.card}>
    {/* Thumbnail */}
    <View style={styles.thumb}>
      <Text style={styles.thumbEmoji}>{
        item.category === "cardio" ? "🚶" :
        item.category === "hiit" ? "⚡" :
        item.category === "yoga" ? "🧘" :
        item.muscleGroups[0]?.includes("chest") ? "🏋️" :
        item.muscleGroups[0]?.includes("back") ? "🚣" :
        item.muscleGroups[0]?.includes("glutes") ? "🏃" :
        item.muscleGroups[0]?.includes("core") ? "🎯" : "💪"
      }</Text>
      <Text style={styles.playHint}>▶</Text>
    </View>
    {/* Info */}
    <View style={styles.body}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.cue} numberOfLines={2}>{item.cueText}</Text>
      <Text style={styles.sets}>
        {item.defaultSets > 1 ? `${item.defaultSets} × ` : ""}{item.defaultReps}
        {item.restSeconds > 0 ? ` · ${item.restSeconds}s rest` : ""}
      </Text>
      {item.tempoNote && <Text style={styles.tempo}>Tempo {item.tempoNote}</Text>}
    </View>
    {/* Tick */}
    <TouchableOpacity
      style={[styles.tick, done && styles.tickDone]}
      onPress={onToggleDone}
    >
      {done && <Text style={styles.tickCheck}>✓</Text>}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radii.lg,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: 12, flexDirection: "row", gap: 11, alignItems: "flex-start",
  },
  thumb: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.card2, borderWidth: 0.5, borderColor: Colors.border2,
    alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative",
  },
  thumbEmoji: { fontSize: 28 },
  playHint: {
    position: "absolute", bottom: 3, right: 4,
    fontSize: 12, color: "rgba(62,219,165,0.5)",
  },
  body: { flex: 1 },
  name: { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink, marginBottom: 3 },
  cue: { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 20, marginBottom: 5 },
  sets: { fontFamily: Typography.mono, fontSize: 14, color: Colors.spring },
  tempo: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  tick: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border2,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
  },
  tickDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  tickCheck: { fontSize: 17, color: Colors.deep },
});
