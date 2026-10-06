import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';

import { colors } from '../theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconName =
  | 'dashboard'
  | 'package'
  | 'basket'
  | 'wallet'
  | 'chart'
  | 'bell'
  | 'search'
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'chevron-right'
  | 'chevron-down'
  | 'peso'
  | 'receipt'
  | 'utensils'
  | 'clock'
  | 'arrow-right'
  | 'percent'
  | 'check-circle'
  | 'phone'
  | 'card'
  | 'more'
  | 'calendar'
  | 'trend-up'
  | 'trend-down'
  | 'alert'
  | 'file'
  | 'share'
  | 'printer'
  | 'info'
  | 'wheat'
  | 'beef'
  | 'bottle'
  | 'sprout'
  | 'egg'
  | 'cash';

/**
 * The Figma file uses Lucide icons. Lucide has no React Native build that ships
 * with Expo Go, so each glyph maps onto the closest glyph already bundled in
 * `@expo/vector-icons` — no extra native dependency required.
 */
const FEATHER: Partial<Record<IconName, FeatherName>> = {
  bell: 'bell',
  search: 'search',
  plus: 'plus',
  minus: 'minus',
  check: 'check',
  close: 'x',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  utensils: 'coffee',
  clock: 'clock',
  'arrow-right': 'arrow-right',
  percent: 'percent',
  'check-circle': 'check-circle',
  phone: 'smartphone',
  card: 'credit-card',
  more: 'more-vertical',
  calendar: 'calendar',
  'trend-up': 'trending-up',
  'trend-down': 'trending-down',
  alert: 'alert-triangle',
  share: 'share-2',
  printer: 'printer',
  info: 'info',
  sprout: 'sun',
};

const MCI: Partial<Record<IconName, MciName>> = {
  dashboard: 'view-dashboard-outline',
  package: 'package-variant-closed',
  basket: 'basket-outline',
  wallet: 'wallet-outline',
  chart: 'chart-bar',
  peso: 'currency-php',
  receipt: 'receipt-text-outline',
  'check-circle': 'check-circle-outline',
  cash: 'cash',
  wheat: 'grain',
  beef: 'food-steak',
  bottle: 'bottle-wine-outline',
  sprout: 'sprout-outline',
  egg: 'egg-outline',
  file: 'file-download-outline',
};

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 20, color = colors.primary }: Props) {
  const feather = FEATHER[name];
  if (feather) {
    return <Feather name={feather} size={size} color={color} />;
  }
  const mci = MCI[name];
  if (mci) {
    return <MaterialCommunityIcons name={mci} size={size} color={color} />;
  }
  return null;
}

export type { IconName };