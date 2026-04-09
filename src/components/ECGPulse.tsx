
import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface Props {
  color?: string;
  width?: number;
  height?: number;
}

export const ECGPulse: React.FC<Props> = ({
  color = "#3EDBA5", width = 200, height = 40,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(translateX, { toValue: -200, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Animated.View style={{ opacity, transform: [{ translateX }] }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M0,${height/2} L${width*0.2},${height/2} L${width*0.28},${height*0.4} L${width*0.3},${height*0.6} L${width*0.32},${height/2} L${width*0.37},${height*0.2} L${width*0.4},${height*0.85} L${width*0.43},${height*0.05} L${width*0.46},${height*0.9} L${width*0.49},${height*0.2} L${width*0.52},${height/2} L${width*0.7},${height/2} L${width},${height/2}`}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
