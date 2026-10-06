import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, text as type } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  title: string;
  /** Optional small caption under the title — only Dashboard uses this. */
  subtitle?: string;
  /** Rendered on the right edge of the bar. */
  actions?: React.ReactNode;
  /** Horizontal padding; the Dashboard app bar insets its title further left. */
  padded?: boolean;
};

/**
 * The orange header shared by every screen. It sits *below* the status bar, so
 * the cream screen background shows through the status bar area.
 */
export function AppBar({ title, subtitle, actions, padded = true }: Props) {
  return (
    <View style={styles.bar}>
      <View style={[styles.titles, padded && styles.padded]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** White pill used for "Order #0065" in the POS header. */
export function OrderChip({ number }: { number: string }) {
  return (
    <View style={styles.orderChip}>
      <Text style={styles.orderChipText}>Order #{number}</Text>
    </View>
  );
}

/** Round translucent avatar in the Dashboard header. */
export function Avatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export function AppBarIcon({
  name,
  onPress,
  accessibilityLabel,
}: {
  name: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Text
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      suppressHighlighting
      style={styles.iconButton}
    >
      <Icon name={name} size={22} color={colors.surface} />
    </Text>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxxl,
  },
  titles: { flex: 1, justifyContent: 'center' },
  padded: { paddingLeft: 0 },
  title: { ...type.titleLg, color: colors.surface },
  subtitle: { ...type.caption, color: colors.surface, opacity: 0.88, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  orderChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  orderChipText: { ...type.labelLg, color: colors.primary },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.labelSm, color: colors.primary },

  iconButton: { padding: spacing.xs },
});