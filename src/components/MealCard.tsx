
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from "react-native";
import { Colors, Typography, Radii, Spacing } from "../theme";
import type { MealItem, MealSlot } from "../types";

const SLOT_LABELS: Record<MealSlot, string> = {
  early_morning: "Early Morning",
  breakfast: "Breakfast",
  mid_morning: "Mid-Morning",
  lunch: "Lunch",
  evening: "Evening",
  dinner: "Dinner",
  bedtime: "Bedtime",
};

const SLOT_TIMES: Record<MealSlot, string> = {
  early_morning: "6:30 AM",
  breakfast: "7:30–8:00 AM",
  mid_morning: "11:00 AM",
  lunch: "1:00–1:30 PM",
  evening: "4:30 PM",
  dinner: "7:00–7:30 PM",
  bedtime: "9:30 PM",
};

interface Props {
  slot: MealSlot;
  item: MealItem;
  isActive?: boolean;
  adjustment?: string;
}

export const MealCard: React.FC<Props> = ({ slot, item, isActive, adjustment }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  return (
    <TouchableOpacity
      style={[styles.card, adjustment && styles.cardAdjusted]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.timeTag}>{SLOT_TIMES[slot]} · {SLOT_LABELS[slot].toUpperCase()}</Text>
        </View>
        {isActive ? (
          <View style={styles.pillTeal}><Text style={styles.pillTextTeal}>Now</Text></View>
        ) : (
          <View style={styles.pillDim}><Text style={styles.pillTextDim}>Upcoming</Text></View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.dishName}>{item.name}</Text>

        {adjustment && (
          <View style={styles.adjustNote}>
            <Text style={styles.adjustText}>{adjustment}</Text>
          </View>
        )}

        {/* Expanded: ingredients */}
        {expanded && (
          <View style={styles.ingredients}>
            <View style={styles.ingHeader}>
              <Text style={[styles.ingCol, { flex:1 }]}>INGREDIENT</Text>
              <Text style={[styles.ingCol, { width:48, textAlign:"right" }]}>GRAMS</Text>
              <Text style={[styles.ingCol, { width:80, textAlign:"right" }]}>MEASURE</Text>
            </View>
            {item.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <Text style={[styles.ingName, { flex:1 }, ing.highlight === "skip" && styles.skipText, ing.highlight === "important" && styles.importantText]}>
                  {ing.name}
                </Text>
                <Text style={[styles.ingGrams, { width:48, textAlign:"right" }, ing.highlight === "skip" && styles.skipText, ing.highlight === "important" && styles.importantText]}>
                  {ing.grams}g
                </Text>
                <Text style={[styles.ingMeasure, { width:80, textAlign:"right" }, ing.highlight === "important" && styles.importantText]}>
                  {ing.measure}
                </Text>
              </View>
            ))}
            {/* Prep note */}
            <View style={styles.prepNote}>
              <Text style={styles.prepText}>{item.prepNote}</Text>
            </View>
          </View>
        )}

        {/* Macros */}
        <View style={[styles.macros, expanded && { marginTop: 4 }]}>
          <Text style={styles.macro}>C <Text style={styles.macroVal}>{item.carbs}g</Text></Text>
          <Text style={styles.macro}>P <Text style={styles.macroVal}>{item.protein}g</Text></Text>
          <Text style={styles.macro}>F <Text style={styles.macroVal}>{item.fat}g</Text></Text>
          <Text style={styles.macro}><Text style={styles.macroVal}>{item.calories}</Text> kcal</Text>
          <Text style={styles.expandHint}>{expanded ? "▲ less" : "▼ quantities"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  cardAdjusted: {
    borderColor: Colors.borderAmber,
    backgroundColor: Colors.glowAmber,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerLeft: { flex: 1 },
  timeTag: {
    fontFamily: Typography.mono,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.teal,
  },
  pillTeal: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    backgroundColor: "rgba(62,219,165,0.1)", borderWidth: 0.5, borderColor: "rgba(62,219,165,0.22)",
  },
  pillTextTeal: { fontFamily: Typography.mono, fontSize: 12, color: Colors.teal },
  pillDim: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 0.5, borderColor: Colors.border,
  },
  pillTextDim: { fontFamily: Typography.mono, fontSize: 12, color: Colors.ink2 },
  body: { padding: 12 },
  dishName: {
    fontFamily: Typography.sansMed, fontSize: 18, color: Colors.ink,
    marginBottom: 4,
  },
  adjustNote: {
    backgroundColor: "rgba(232,184,75,0.08)",
    borderRadius: Radii.sm, padding: 8, marginBottom: 8,
    borderLeftWidth: 2, borderLeftColor: Colors.amber,
  },
  adjustText: { fontFamily: Typography.sans, fontSize: 14, color: Colors.amber, lineHeight: 20 },
  // Ingredients
  ingredients: { marginBottom: 8 },
  ingHeader: {
    flexDirection: "row", paddingBottom: 5, marginBottom: 5,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  ingCol: { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 1.5, color: Colors.ink3, textTransform: "uppercase" },
  ingRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  ingName: { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, flex: 1 },
  ingGrams: { fontFamily: Typography.mono, fontSize: 15, color: Colors.spring },
  ingMeasure: { fontFamily: Typography.mono, fontSize: 14, color: Colors.ink2 },
  skipText: { color: Colors.rose },
  importantText: { color: Colors.teal },
  prepNote: {
    marginTop: 8, backgroundColor: "rgba(62,219,165,0.05)",
    borderRadius: Radii.sm, padding: 8,
  },
  prepText: { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 20 },
  // Macros
  macros: {
    flexDirection: "row", gap: 12, alignItems: "center",
    marginTop: 0,
  },
  macro: { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink2 },
  macroVal: { color: Colors.spring },
  expandHint: {
    fontFamily: Typography.mono, fontSize: 13, color: Colors.teal,
    marginLeft: "auto",
  },
});
