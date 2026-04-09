import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radii } from "../../theme";
import { useAppStore } from "../../store/useAppStore";
import { SectionCap } from "../../components/SectionCap";
import { markSupplementTaken as markSupplementTakenSupabase } from "../../services/patientService";
// FIX: import shared IS_DEMO constant
import { IS_DEMO } from "../../lib/constants";

const ICONS: Record<string, string> = {
  "Vitamin D3 + K2": "🌞",
  "Berberine 500mg": "🌿",
  "Vitamin B12 (Methylcobalamin) 500mcg": "💊",
  "Magnesium Glycinate 300mg": "🌙",
  "Omega-3 (EPA+DHA) 1g": "🐟",
  "Alpha Lipoic Acid 300mg": "⚡",
  "Myo-Inositol + D-Chiro Inositol (40:1)": "🔬",
  "N-Acetyl Cysteine (NAC) 600mg": "🧬",
  "Evening Primrose Oil 1000mg": "🌸",
  "Selenium (Selenomethionine) 200mcg": "🔩",
  "Zinc Picolinate 30mg": "⚙",
  "Ashwagandha (KSM-66) 300mg": "🌙",
  "CoQ10 (Ubiquinol) 100mg": "❤",
  "Probiotic (Multi-strain, 10B CFU)": "🦠",
  "Iron Bisglycinate 25mg + Vitamin C": "🩸",
  "Vitamin B-Complex (Activated)": "🌈",
};

const BG_COLORS: Record<string, string> = {
  "🌞": "rgba(232,184,75,0.12)",
  "🌿": "rgba(62,219,165,0.1)",
  "💊": "rgba(74,144,184,0.12)",
  "🌙": "rgba(62,219,165,0.08)",
  "🐟": "rgba(74,144,184,0.1)",
  "⚡": "rgba(232,184,75,0.1)",
  "🔬": "rgba(62,219,165,0.1)",
  "🌸": "rgba(217,123,114,0.1)",
  "❤": "rgba(217,123,114,0.1)",
  "🩸": "rgba(217,123,114,0.08)",
};

// FIX: proper type for supplement item props instead of `any`
interface SupplItemProps {
  s: { name: string; dose: string; timing: string; withFood: string; patientReason: string; taken?: boolean };
  onToggle: () => void;
}

const SupplItem = ({ s, onToggle }: SupplItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const icon = ICONS[s.name] ?? "💊";
  const bg = BG_COLORS[icon] ?? "rgba(62,219,165,0.08)";

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  return (
    <TouchableOpacity
      style={[styles.item, !s.taken && styles.itemPending]}
      onPress={toggle}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{s.name}</Text>
        <Text style={styles.timing}>{s.dose} · {s.timing}</Text>
        <Text style={styles.withFood}>{s.withFood}</Text>
        {expanded && (
          <View style={styles.expanded}>
            <Text style={styles.whyLabel}>WHY YOU'RE TAKING THIS</Text>
            <Text style={styles.whyText}>{s.patientReason}</Text>
          </View>
        )}
        <Text style={styles.expandHint}>{expanded ? "▲ less" : "▼ why this supplement"}</Text>
      </View>
      <TouchableOpacity
        style={[styles.check, s.taken && styles.checkDone]}
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {s.taken && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const SupplementsScreen = () => {
  const { patient, markSupplementTaken } = useAppStore();
  const { supplements } = patient;

  // FIX: optimistic update — update local store immediately, sync to Supabase in background
  // On failure, revert the local state
  const handleToggle = (name: string, taken: boolean) => {
    markSupplementTaken(name, taken); // instant UI update
    if (!IS_DEMO) {
      markSupplementTakenSupabase(name, taken).catch(() => {
        markSupplementTaken(name, !taken); // revert on failure
      });
    }
  };
  const taken = supplements.filter(s => s.taken).length;
  const pct = Math.round((taken / Math.max(supplements.length, 1)) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerGlow} />
          <Text style={styles.title}>Today's supplements</Text>
          <Text style={styles.sub}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          <View style={styles.progRow}>
            <View style={styles.progBar}>
              <View style={[styles.progFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progText}>{taken} of {supplements.length} taken</Text>
          </View>
        </View>

        {/* FIX: replaced hardcoded "Berberine" check with generic low-supply warning for any supplement
             TODO: add a `refillDays` or `lowStock` flag to supplement data to drive this properly */}
        {supplements.length > 0 && (
          <View style={styles.refill}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={styles.refillText}>
              Supplements running low? Message your team to arrange a refill.
            </Text>
          </View>
        )}

        {/* Taken */}
        {supplements.filter(s => s.taken).length > 0 && (
          <>
            <SectionCap title={`Taken today · ${supplements.filter(s => s.taken).length}`} color={Colors.teal} />
            {supplements.filter(s => s.taken).map(s => (
              <SupplItem key={s.name} s={s} onToggle={() => handleToggle(s.name, false)} />
            ))}
          </>
        )}

        {/* Still to take */}
        {supplements.filter(s => !s.taken).length > 0 && (
          <>
            <SectionCap title={`Still to take · ${supplements.filter(s => !s.taken).length}`} />
            {supplements.filter(s => !s.taken).map(s => (
              <SupplItem key={s.name} s={s} onToggle={() => handleToggle(s.name, true)} />
            ))}
          </>
        )}

        {/* All done */}
        {taken === supplements.length && supplements.length > 0 && (
          <View style={styles.allDone}>
            <Text style={styles.allDoneTitle}>All supplements taken ✅</Text>
            <Text style={styles.allDoneBody}>Great consistency. This adds up significantly over weeks and months.</Text>
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteLabel}>TIMING NOTE</Text>
          <Text style={styles.noteText}>
            Tap any supplement to see why it was prescribed for your condition and when exactly to take it. Some supplements interact with each other — your team has sequenced these carefully.
          </Text>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.deep },
  header:     { padding: Spacing.xl, paddingBottom: Spacing.md, position: "relative" },
  // FIX: replaced inset:0 with explicit edges (inset not valid in RN)
  headerGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,107,84,0.12)" },
  title:      { fontFamily: Typography.sansMed, fontSize: 22, color: Colors.ink, marginBottom: 3 },
  sub:        { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2 },
  progRow:    { flexDirection: "row", alignItems: "center", gap: 12, marginTop: Spacing.sm },
  progBar:    { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  progFill:   { height: "100%", backgroundColor: Colors.teal, borderRadius: 2 },
  progText:   { fontFamily: Typography.mono, fontSize: 14, color: Colors.teal },
  refill:     { marginHorizontal: Spacing.lg, marginBottom: 4, backgroundColor: "rgba(232,184,75,0.06)", borderRadius: Radii.md, borderWidth: 0.5, borderColor: "rgba(232,184,75,0.22)", padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  refillText: { fontFamily: Typography.sans, fontSize: 15, color: Colors.amber, flex: 1, lineHeight: 21 },
  item:       { marginHorizontal: Spacing.lg, marginBottom: 7, backgroundColor: Colors.card, borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  itemPending:{ borderColor: Colors.border2 },
  iconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  iconText:   { fontSize: 24 },
  info:       { flex: 1 },
  name:       { fontFamily: Typography.sansMed, fontSize: 17, color: Colors.ink, marginBottom: 3 },
  timing:     { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2 },
  withFood:   { fontFamily: Typography.mono, fontSize: 13, color: Colors.ink3, marginTop: 2 },
  expanded:   { marginTop: 9, paddingTop: 9, borderTopWidth: 0.5, borderTopColor: Colors.border },
  whyLabel:   { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2, color: Colors.teal, marginBottom: 5 },
  whyText:    { fontFamily: Typography.sans, fontSize: 15, color: Colors.ink2, lineHeight: 22 },
  expandHint: { fontFamily: Typography.mono, fontSize: 13, color: Colors.teal, marginTop: 7 },
  check:      { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: Colors.border2, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  checkDone:  { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkMark:  { fontSize: 18, color: Colors.deep, fontWeight: "600" },
  allDone:    { marginHorizontal: Spacing.lg, backgroundColor: "rgba(62,219,165,0.06)", borderRadius: Radii.lg, borderWidth: 0.5, borderColor: Colors.border3, padding: Spacing.lg, alignItems: "center", marginBottom: Spacing.md },
  allDoneTitle:{ fontFamily: Typography.display, fontSize: 21, color: Colors.teal, marginBottom: 4 },
  allDoneBody: { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink2, textAlign: "center" },
  noteCard:   { marginHorizontal: Spacing.lg, backgroundColor: Colors.card, borderRadius: Radii.md, borderWidth: 0.5, borderColor: Colors.border, padding: 13, marginBottom: 8 },
  noteLabel:  { fontFamily: Typography.mono, fontSize: 12, letterSpacing: 2, color: Colors.ink3, marginBottom: 5 },
  noteText:   { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink2, lineHeight: 21 },
});
