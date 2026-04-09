
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Typography } from "../theme";

type PillColor = "teal" | "amber" | "rose" | "dim" | "em";

interface Props { label: string; color: PillColor; }

const BG: Record<PillColor,string> = {
  teal:"rgba(62,219,165,0.1)", amber:"rgba(232,184,75,0.1)",
  rose:"rgba(217,123,114,0.1)", dim:"rgba(255,255,255,0.04)", em:"#1B6B54",
};
const BD: Record<PillColor,string> = {
  teal:"rgba(62,219,165,0.22)", amber:"rgba(232,184,75,0.22)",
  rose:"rgba(217,123,114,0.22)", dim:"rgba(62,219,165,0.09)", em:"#1B6B54",
};
const TC: Record<PillColor,string> = {
  teal:"#3EDBA5", amber:"#E8B84B", rose:"#D97B72", dim:"#6E9080", em:"#A8F5D5",
};

export const Pill: React.FC<Props> = ({ label, color }) => (
  <View style={{ paddingHorizontal:9, paddingVertical:3, borderRadius:20, borderWidth:0.5, backgroundColor:BG[color], borderColor:BD[color] }}>
    <Text style={{ fontFamily:Typography.mono, fontSize:12, color:TC[color], letterSpacing:0.3 }}>{label}</Text>
  </View>
);
