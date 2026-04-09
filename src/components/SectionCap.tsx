
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing, Opacity } from "../theme";

interface Props { title: string; color?: string; }

export const SectionCap: React.FC<Props> = ({ title, color = Colors.ink3 }) => (
  <View style={styles.row}>
    <Text style={[styles.text, { color }]}>{title}</Text>
    {/* FIX: use theme Opacity.divider instead of hardcoded 0.25 */}
    <View style={[styles.line, color !== Colors.ink3 && { backgroundColor: color, opacity: Opacity.divider }]} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  text: {
    fontFamily: Typography.mono, fontSize: 12,
    letterSpacing: 3, textTransform: "uppercase",
  },
  line: { flex: 1, height: 0.5, backgroundColor: Colors.border },
});
