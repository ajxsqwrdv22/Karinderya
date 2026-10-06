import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing, text as type } from '../theme';
import { Icon, type IconName } from './Icon';

/** White rounded surface — the base of nearly every block in the design. */
export function Card({
  children,
  style,
  padded = spacing.lg,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: number;
}) {
  return (
    <View style={[styles.card, { padding: padded }, style]}>{children}</View>
  );
}

export function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginHorizontal: inset }]} />;
}

/** Pill filter used for categories, stock filters and date ranges. */
export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Full-width pill button — the "Primary button" from the design. */
export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={colors.surface} /> : null}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** White outlined pill button — the "Secondary button" from the design. */
export function SecondaryButton({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, style]}
    >
      {icon ? <Icon name={icon} size={18} color={colors.primary} /> : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

/** Floating orange pill anchored to the bottom-right of a screen. */
export function Fab({
  label,
  icon = 'plus',
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed, style]}
    >
      <Icon name={icon} size={22} color={colors.surface} />
      <Text style={styles.fabLabel}>{label}</Text>
    </Pressable>
  );
}

/** Two-option switch used at the top of Inventory and Payment. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmentTrack}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small circular badge, e.g. the "Pending" pill on a Payment card. */
export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'pending' | 'paid' | 'neutral';
}) {
  const toneStyle =
    tone === 'pending'
      ? styles.badgePending
      : tone === 'paid'
        ? styles.badgePaid
        : styles.badgeNeutral;

  const labelStyle =
    tone === 'pending'
      ? styles.badgeLabelPending
      : tone === 'paid'
        ? styles.badgeLabelPaid
        : styles.badgeLabelNeutral;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeLabel, labelStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  sectionTitle: { ...type.labelLg, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },

  chip: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { ...type.bodyMd, color: colors.textMuted, fontWeight: '500' },
  chipLabelSelected: { color: colors.surface },

  primaryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryLabel: { ...type.titleSm, color: colors.surface },

  secondaryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryLabel: { ...type.titleSm, color: colors.primary },

  fab: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.floating,
  },
  fabLabel: { ...type.titleSm, color: colors.surface },

  segmentTrack: {
    height: 40,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentSelected: { backgroundColor: colors.surface, ...shadow.card },
  segmentLabel: { ...type.labelLg, color: colors.textMuted },
  segmentLabelSelected: { color: colors.primary },

  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgePending: { backgroundColor: colors.dangerSoft },
  badgePaid: { backgroundColor: colors.successSoft },
  badgeNeutral: { backgroundColor: colors.neutralSoft },
  badgeLabel: { ...type.bodyMd, fontWeight: '700' },
  badgeLabelPending: { color: colors.danger },
  badgeLabelPaid: { color: colors.success },
  badgeLabelNeutral: { color: colors.textMuted },

  pressed: { opacity: 0.75 },
});