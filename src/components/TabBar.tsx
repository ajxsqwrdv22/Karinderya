import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabTriggerSlotProps } from 'expo-router/ui';

import { Icon, type IconName } from './Icon';
import { colors, radius, spacing, text as type } from '../theme';

/**
 * Bottom navigation container. Used as the `asChild` target of `<TabList />`,
 * so `TabTrigger` children are rendered inside it.
 *
 * Matches the Figma spec: white bar, hairline top border, five evenly spread
 * destinations, and padding that clears the Android gesture area.
 */
export function TabBar({ style, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        style,
      ]}
    />
  );
}

export type TabButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  label: string;
};

/**
 * A single tab destination. `TabTrigger` forwards `isFocused`, which drives the
 * orange pill behind the icon and the bold orange label.
 */
export function TabButton({ icon, label, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable {...props} style={styles.item} accessibilityRole="tab">
      <View style={[styles.indicator, isFocused && styles.indicatorActive]}>
        <Icon
          name={icon}
          size={20}
          color={isFocused ? colors.primary : colors.textFaint}
        />
      </View>
      <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  item: { alignItems: 'center', width: 64, gap: 2 },
  indicator: {
    width: 40,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: { backgroundColor: colors.primarySoft },
  label: { ...type.caption, color: colors.textFaint, fontWeight: '500' },
  labelActive: { color: colors.primary, fontWeight: '700' },
});