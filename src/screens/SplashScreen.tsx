
import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Colors, Typography, Spacing, Radii } from "../theme";
import { NishkritiLogo } from "../components/NishkritiLogo";
import { useAppStore } from "../store/useAppStore";

const { width } = Dimensions.get("window");

export const SplashScreen = () => {
  const { setMode, setSplashDone } = useAppStore();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const nameAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim  = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.sequence([
      Animated.timing(logoAnim, { toValue:1, duration:900, useNativeDriver:true }),
      Animated.timing(nameAnim, { toValue:1, duration:600, useNativeDriver:true }),
      Animated.timing(ctaAnim,  { toValue:1, duration:500, useNativeDriver:true }),
    ]).start();
    // Pulsing rings
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue:1.06, duration:1500, useNativeDriver:true }),
        Animated.timing(anim, { toValue:1,    duration:1500, useNativeDriver:true }),
      ]));
    pulse(ring1, 0).start(); pulse(ring2, 600).start(); pulse(ring3, 1200).start();
  }, []);

  const navigation = useNavigation<any>();
  const DEMO = !process.env.EXPO_PUBLIC_SUPABASE_URL;

  const enter = (m: "patient"|"doctor") => {
    setMode(m);
    if (DEMO) {
      setSplashDone();
    } else {
      // In production: navigate to auth screen
      if (m === "doctor") {
        navigation.navigate("DoctorLogin");
      } else {
        navigation.navigate("PhoneAuth");
      }
    }
  };

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        {/* Rings */}
        {[ring1, ring2, ring3].map((r, i) => (
          <Animated.View key={i} style={[styles.ring, { width:140+i*70, height:140+i*70, borderRadius:105+i*35, transform:[{scale:r}], opacity:0.15-i*0.04 }]} />
        ))}
        {/* Glow */}
        <View style={styles.glow} />
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { opacity:logoAnim, transform:[{scale: logoAnim.interpolate({inputRange:[0,1],outputRange:[0.6,1]})}] }]}>
          <NishkritiLogo size={90} showPulse />
        </Animated.View>
        {/* Name */}
        <Animated.View style={[styles.nameWrap, { opacity:nameAnim, transform:[{translateY: nameAnim.interpolate({inputRange:[0,1],outputRange:[14,0]})}] }]}>
          <Text style={styles.name}>Nishkriti</Text>
          <Text style={styles.deva}>निष्कृति</Text>
          <Text style={styles.tagline}>ROOT CAUSE · REVERSAL · REBUILD</Text>
        </Animated.View>
        {/* CTAs */}
        <Animated.View style={[styles.ctaWrap, { opacity:ctaAnim, transform:[{translateY: ctaAnim.interpolate({inputRange:[0,1],outputRange:[16,0]})}] }]}>
          <TouchableOpacity style={styles.btnPatient} onPress={() => enter("patient")}>
            <Text style={styles.btnPatientText}>I'm a patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDoctor} onPress={() => enter("doctor")}>
            <Text style={styles.btnDoctorText}>I'm a doctor</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: { flex:1, backgroundColor:Colors.bg, alignItems:"center", justifyContent:"center" },
  safe: { flex:1, width:"100%", alignItems:"center", justifyContent:"center", padding:Spacing.xl },
  ring: {
    position:"absolute", borderWidth:1, borderColor:"rgba(62,219,165,0.12)",
    alignSelf:"center",
  },
  glow: {
    position:"absolute", width:220, height:220, borderRadius:110,
    backgroundColor:"rgba(62,219,165,0.06)", alignSelf:"center",
  },
  logoWrap: { marginBottom:Spacing.xl, alignItems:"center" },
  nameWrap: { alignItems:"center", marginBottom:Spacing.xxxl },
  name: {
    fontFamily:Typography.display, fontSize:50, color:Colors.ink,
    letterSpacing:-0.5, lineHeight:64,
  },
  deva: { fontFamily:Typography.deva, fontSize:21, color:Colors.ink2, marginTop:4 },
  tagline: {
    fontFamily:Typography.mono, fontSize:14, letterSpacing:3.5,
    color:"rgba(62,219,165,0.4)", marginTop:Spacing.lg, textTransform:"uppercase",
  },
  ctaWrap: { width:"100%", gap:Spacing.md },
  btnPatient: {
    backgroundColor:Colors.teal, borderRadius:Radii.xl,
    paddingVertical:16, alignItems:"center",
  },
  btnPatientText: { fontFamily:Typography.sansMed, fontSize:20, color:Colors.deep, fontWeight:"600", letterSpacing:0.3 },
  btnDoctor: {
    borderRadius:Radii.xl, borderWidth:0.5, borderColor:Colors.border3,
    paddingVertical:15, alignItems:"center",
  },
  btnDoctorText: { fontFamily:Typography.sansMed, fontSize:20, color:Colors.teal, letterSpacing:0.3 },
});
