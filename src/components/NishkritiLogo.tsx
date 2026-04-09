
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import Svg, { Path, Rect, LinearGradient, Stop, Defs, Mask } from "react-native-svg";

interface Props {
  size?: number;
  showPulse?: boolean;
  pulseColor?: string;
}

export const NishkritiLogo: React.FC<Props> = ({
  size = 40, showPulse = true, pulseColor = "#3EDBA5",
}) => {
  const dashOffset = useRef(new Animated.Value(220)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showPulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dashOffset, { toValue: 0, duration: 1600, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]),
        Animated.delay(600),
        Animated.timing(dashOffset, { toValue: 220, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showPulse]);

  const h = size * 1.19;
  return (
    <View style={{ width: size, height: h }}>
      <Svg width={size} height={h} viewBox="0 0 180 214">
        <Defs>
          <LinearGradient id="mg" x1="0" y1="0" x2="180" y2="214" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#B0F5DC" />
            <Stop offset="30%" stopColor="#3EDBA5" />
            <Stop offset="70%" stopColor="#22B88A" />
            <Stop offset="100%" stopColor="#1B6B54" />
          </LinearGradient>
          <LinearGradient id="bg" x1="0" y1="0" x2="164" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#B0F5DC" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#5AEDB5" stopOpacity="1" />
            <Stop offset="100%" stopColor="#B0F5DC" stopOpacity="0.3" />
          </LinearGradient>
          <Mask id="cx">
            <Rect x="0" y="0" width="180" height="214" fill="white" />
            <Rect x="81" y="80" width="18" height="68" rx="9" fill="black" />
            <Rect x="56" y="105" width="68" height="18" rx="9" fill="black" />
          </Mask>
        </Defs>
        {/* Shine bar */}
        <Rect x="8" y="4" width="164" height="7" rx="3.5" fill="url(#bg)" />
        {/* N mark */}
        <Path
          d="M12,28Q12,20 20,20L36,20Q44,20 44,28L44,122L136,20Q136,20 144,20L160,20Q168,20 168,28L168,200Q168,208 160,208L144,208Q136,208 136,200L136,106L44,208Q44,208 36,208L20,208Q12,208 12,200Z"
          fill="url(#mg)"
          mask="url(#cx)"
        />
        {/* ECG pulse — animated via opacity since RN SVG stroke-dashoffset is complex */}
        {showPulse && (
          <Path
            d="M46,114L68,114L76,112L78,116L80,114L84,106L87,124L90,100L93,128L96,106L98,114L106,114L134,114"
            fill="none"
            stroke={pulseColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        )}
      </Svg>
    </View>
  );
};
