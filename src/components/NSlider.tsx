import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import { Colors } from '../theme';

interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange: (v: number) => void;
  trackColor?: string;
  thumbColor?: string;
  style?: any;
}

export const NSlider: React.FC<Props> = ({
  min, max, step = 1, value, onValueChange,
  trackColor = Colors.teal, thumbColor = Colors.spring, style,
}) => {
  const width = useRef(0);

  // FIX: guard min === max — dividing by zero produces NaN slider width
  const pct = max === min ? 0 : (value - min) / (max - min);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      if (!width.current) return;
      const x = e.nativeEvent.locationX;
      const ratio = Math.min(Math.max(x / width.current, 0), 1);
      const raw = min + ratio * (max - min);
      onValueChange(Math.round(raw / step) * step);
    },
    onPanResponderMove: (_, gs) => {
      if (!width.current) return;
      const x = gs.moveX - gs.x0 + (pct * width.current);
      const ratio = Math.min(Math.max(x / width.current, 0), 1);
      const raw = min + ratio * (max - min);
      onValueChange(Math.round(raw / step) * step);
    },
  });

  return (
    <View
      style={[styles.track, style]}
      onLayout={e => { width.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: trackColor }]} />
      <View style={[styles.thumb, { left: `${pct * 100}%`, backgroundColor: thumbColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 4, backgroundColor: Colors.card2, borderRadius: 2,
    position: 'relative', justifyContent: 'center',
    marginVertical: 14,
  },
  fill: {
    position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 2,
  },
  thumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    marginLeft: -10, top: -8,
    borderWidth: 2.5, borderColor: Colors.deep,
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
  },
});
