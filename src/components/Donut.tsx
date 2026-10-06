import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
};

/** Arc resolution — enough segments that a ring reads as smooth. */
const SEGMENTS = 48;

/**
 * Ring gauge drawn as small rotated segments instead of using SVG, so the app
 * stays free of extra native dependencies and works in Expo Go.
 *
 * Each segment is a bar running from the circle's centre out to the ring, pivoted
 * on its bottom edge, which places the rotation origin exactly at the centre.
 */
export function Donut({
  value,
  size = 62,
  thickness = 7,
  color = colors.success,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - thickness) / 2;
  const filledCount = Math.round((clamped / 100) * SEGMENTS);

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: SEGMENTS }, (_, index) => {
        const angle = (index / SEGMENTS) * 360;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                width: thickness,
                height: radius,
                left: size / 2 - thickness / 2,
                top: thickness / 2,
                borderTopLeftRadius: thickness / 2,
                borderTopRightRadius: thickness / 2,
                backgroundColor:
                  index < filledCount ? color : colors.track,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    // Rotate around the bottom edge, which sits at the circle's centre.
    transformOrigin: 'bottom',
  },
});