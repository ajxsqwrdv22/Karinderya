/**
 * Design tokens extracted from the Figma file (KarinderyaNiAJ).
 * Every colour, radius and type size below is copied from the real design specs.
 */

export const colors = {
  /** Screen background — warm cream */
  background: '#FFF8F1',
  /** Cards, sheets, nav bars */
  surface: '#FFFFFF',

  /** Brand orange */
  primary: '#E8590C',
  /** Selected tab / avatar chip background */
  primarySoft: '#FFE8D6',
  /** "Add" button, inactive payment method background */
  primaryTint: '#FFF1E6',

  /** Hairline dividers and outlined chip borders */
  border: '#F0E4D7',

  /** Default text colour */
  text: '#212529',
  /** Secondary text — labels, captions */
  textMuted: '#6C757D',
  /** Tertiary text — inactive tab labels, chevrons */
  textFaint: '#8A8F94',

  success: '#2F9E44',
  successSoft: '#EAF7ED',

  info: '#1C7ED6',
  infoSoft: '#E7F5FF',

  warning: '#F59F00',
  warningSoft: '#FFF4CC',

  danger: '#E03131',
  dangerSoft: '#FFF0F0',

  /** Segmented control track, SOLD OUT button */
  neutralSoft: '#F1F3F5',
  /** Progress bar track, sheet handle */
  track: '#E9ECEF',

  /** Scrim behind the expanded order sheet */
  scrim: 'rgba(0,0,0,0.45)',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
} as const;

/**
 * The design uses Roboto, which is the Android system font, so no custom font
 * file is required. `fontWeight` strings map onto the platform font.
 */
export const text = {
  displayLg: { fontSize: 28, lineHeight: 33, fontWeight: '700' },
  displayMd: { fontSize: 24, lineHeight: 28, fontWeight: '700' },
  titleLg: { fontSize: 20, lineHeight: 23, fontWeight: '700' },
  titleMd: { fontSize: 18, lineHeight: 21, fontWeight: '700' },
  titleSm: { fontSize: 14, lineHeight: 16, fontWeight: '700' },
  bodyLg: { fontSize: 14, lineHeight: 16, fontWeight: '400' },
  bodyMd: { fontSize: 12, lineHeight: 14, fontWeight: '400' },
  bodySm: { fontSize: 11, lineHeight: 13, fontWeight: '400' },
  labelLg: { fontSize: 12, lineHeight: 14, fontWeight: '700' },
  labelMd: { fontSize: 11, lineHeight: 13, fontWeight: '700' },
  labelSm: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  caption: { fontSize: 9, lineHeight: 11, fontWeight: '400' },
} as const;

/** Soft card shadow used across every white surface in the design. */
export const shadow = {
  card: {
    shadowColor: '#C89060',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#A8541A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 16,
  },
} as const;

export const theme = { colors, radius, spacing, text, shadow };
export type Theme = typeof theme;