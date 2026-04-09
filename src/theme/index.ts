
import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  bg:     '#070F0C',
  deep:   '#0D1F1A',
  forest: '#0F2318',
  card:   '#172820',
  card2:  '#1D3530',
  card3:  '#223C36',
  em:     '#1B6B54',
  teal:   '#3EDBA5',
  spring: '#A8F5D5',
  cream:  '#F5F0E8',
  rose:   '#D97B72',
  amber:  '#E8B84B',
  blue:   '#4A90B8',
  ink:    '#DDE8E2',
  ink2:   '#6E9080',
  ink3:   '#3D5C4E',
  border:      'rgba(62,219,165,0.09)',
  border2:     'rgba(62,219,165,0.18)',
  border3:     'rgba(62,219,165,0.30)',
  borderRose:  'rgba(217,123,114,0.22)',
  borderAmber: 'rgba(232,184,75,0.22)',
  // Semantic
  success: '#3EDBA5',
  warning: '#E8B84B',
  danger:  '#D97B72',
  info:    '#4A90B8',
  // Transparent overlays
  glowTeal:  'rgba(62,219,165,0.08)',
  glowRose:  'rgba(217,123,114,0.08)',
  glowAmber: 'rgba(232,184,75,0.06)',
};

// FIX: these font families require loading via useFonts() in App.tsx before use.
// If fonts fail to load, React Native silently falls back to system fonts.
// Font loading is handled in App.tsx via expo-font — ensure it completes before rendering.
export const Typography = {
  // Families
  display: Platform.select({ ios: 'Lora-Italic', android: 'Lora-Italic' }),
  displayUpright: Platform.select({ ios: 'Lora-Medium', android: 'Lora-Medium' }),
  sans:    Platform.select({ ios: 'DMSans-Regular', android: 'DMSans-Regular' }),
  sansMed: Platform.select({ ios: 'DMSans-Medium', android: 'DMSans-Medium' }),
  mono:    Platform.select({ ios: 'DMMono-Regular', android: 'DMMono-Regular' }),
  deva:    Platform.select({ ios: 'NotoSerifDevanagari-Bold', android: 'NotoSerifDevanagari-Bold' }),
  // Sizes (iPad-optimized)
  size: { xs:12, sm:14, base:16, md:18, lg:20, xl:24, xxl:30, hero:38, display:44 },
  // Line heights
  lineHeight: { tight:1.15, normal:1.5, relaxed:1.65, loose:1.8 },
};

export const Spacing = {
  xs:4, sm:8, md:12, lg:16, xl:20, xxl:28, xxxl:40,
};

export const Radii = {
  sm:8, md:12, lg:18, xl:24, full:999,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width:0, height:8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  phone: {
    shadowColor: '#000',
    shadowOffset: { width:0, height:40 },
    shadowOpacity: 0.7,
    shadowRadius: 80,
    elevation: 24,
  },
};

export const globalStyles = StyleSheet.create({
  fill: { flex:1 },
  screen: { flex:1, backgroundColor: Colors.deep },
  safeTop: { backgroundColor: Colors.deep },
  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  cardPad: { padding: Spacing.md },
  // Typography
  heroText: {
    fontFamily: Typography.display,
    fontSize: Typography.size.hero,
    color: Colors.ink,
    lineHeight: Typography.size.hero * 1.2,
  },
  h1: {
    fontFamily: Typography.display,
    fontSize: Typography.size.xxl,
    color: Colors.ink,
    lineHeight: Typography.size.xxl * 1.25,
  },
  h2: {
    fontFamily: Typography.display,
    fontSize: Typography.size.xl,
    color: Colors.ink,
    lineHeight: Typography.size.xl * 1.25,
  },
  h3: {
    fontFamily: Typography.displayUpright,
    fontSize: Typography.size.lg,
    color: Colors.ink,
  },
  label: {
    fontFamily: Typography.mono,
    fontSize: Typography.size.xs,
    color: Colors.teal,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: Typography.sans,
    fontSize: Typography.size.base,
    color: Colors.ink2,
    lineHeight: Typography.size.base * 1.65,
  },
  bodySm: {
    fontFamily: Typography.sans,
    fontSize: Typography.size.sm,
    color: Colors.ink2,
    lineHeight: Typography.size.sm * 1.65,
  },
  mono: {
    fontFamily: Typography.mono,
    color: Colors.spring,
  },
  num: {
    fontFamily: Typography.mono,
    color: Colors.spring,
    fontSize: Typography.size.hero,
    fontWeight: '500',
  },
  numMd: {
    fontFamily: Typography.mono,
    color: Colors.spring,
    fontSize: Typography.size.xl,
  },
  // Buttons
  btnPri: {
    backgroundColor: Colors.teal,
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  btnPriText: {
    fontFamily: Typography.sansMed,
    fontSize: Typography.size.md,
    color: Colors.deep,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  btnSec: {
    borderRadius: Radii.lg,
    borderWidth: 0.5,
    borderColor: Colors.border3,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  btnSecText: {
    fontFamily: Typography.sansMed,
    fontSize: Typography.size.md,
    color: Colors.teal,
    letterSpacing: 0.3,
  },
  // Section cap
  sectionCap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionCapText: {
    fontFamily: Typography.mono,
    fontSize: 12,
    letterSpacing: 3,
    color: Colors.ink3,
    textTransform: 'uppercase',
  },
  sectionCapLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.border,
  },
  // Row helpers
  rowSb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowGap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});

// FIX: pill and pillText are dynamic style helpers — they cannot live inside
// StyleSheet.create() because it expects static objects, not functions.
export const pill = (color: 'teal'|'amber'|'rose'|'dim'|'em') => ({
  paddingHorizontal: 9,
  paddingVertical: 3,
  borderRadius: 20,
  borderWidth: 0.5,
  ...(color === 'teal'  && { backgroundColor:'rgba(62,219,165,0.1)',  borderColor:'rgba(62,219,165,0.22)' }),
  ...(color === 'amber' && { backgroundColor:'rgba(232,184,75,0.1)',  borderColor:'rgba(232,184,75,0.22)' }),
  ...(color === 'rose'  && { backgroundColor:'rgba(217,123,114,0.1)', borderColor:'rgba(217,123,114,0.22)' }),
  ...(color === 'dim'   && { backgroundColor:'rgba(255,255,255,0.04)',borderColor: Colors.border }),
  ...(color === 'em'    && { backgroundColor: Colors.em }),
});

export const pillText = (color: 'teal'|'amber'|'rose'|'dim'|'em') => ({
  fontFamily: Typography.mono,
  fontSize: Typography.size.xs,
  letterSpacing: 0.3,
  ...(color === 'teal'  && { color: Colors.teal }),
  ...(color === 'amber' && { color: Colors.amber }),
  ...(color === 'rose'  && { color: Colors.rose }),
  ...(color === 'dim'   && { color: Colors.ink2 }),
  ...(color === 'em'    && { color: Colors.spring }),
});
