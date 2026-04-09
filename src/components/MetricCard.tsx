
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Radii, Spacing } from "../theme";

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaPositive?: boolean;
  status?: "ok" | "warn" | "alert" | "critical";
  style?: any;
}

export const MetricCard: React.FC<Props> = ({
  label, value, unit, delta, deltaPositive, status = "ok", style,
}) => {
  const statusColor = {
    ok: Colors.teal,
    warn: Colors.amber,
    alert: Colors.rose,
    critical: Colors.rose,
  }[status];

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={[styles.value, { color: status !== "ok" ? statusColor : Colors.spring }]}>
          {value}
        </Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {delta && (
        <Text style={[styles.delta, { color: deltaPositive !== false ? Colors.teal : Colors.rose }]}>
          {delta}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.md - 2,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  label: {
    fontFamily: Typography.sans,
    fontSize: Typography.size.xs + 0.5,
    color: Colors.ink2,
    marginBottom: 3,
  },
  row: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  value: {
    fontFamily: Typography.mono,
    fontSize: Typography.size.xl - 1,
    fontWeight: "500",
    color: Colors.spring,
    lineHeight: Typography.size.xl,
  },
  unit: {
    fontFamily: Typography.mono,
    fontSize: Typography.size.xs,
    color: Colors.ink2,
  },
  delta: {
    fontFamily: Typography.mono,
    fontSize: Typography.size.xs,
    marginTop: 3,
  },
});
