
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Radii, Spacing } from "../theme";

interface Props {
  label?: string;
  text: string;
  accentColor?: string;
}

export const ReasoningBox: React.FC<Props> = ({
  label = "WHY TODAY IS DIFFERENT",
  text,
  accentColor = Colors.teal,
}) => (
  <View style={[styles.box, { borderLeftColor: accentColor }]}>
    <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  box: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: "rgba(27,107,84,0.25)",
    borderRadius: Radii.md, borderLeftWidth: 2.5,
    padding: 13,
  },
  label: {
    fontFamily: Typography.mono, fontSize: 12,
    letterSpacing: 2.5, textTransform: "uppercase",
    marginBottom: 5,
  },
  text: {
    fontFamily: Typography.sans, fontSize: 15,
    color: Colors.ink2, lineHeight: 23,
  },
});
