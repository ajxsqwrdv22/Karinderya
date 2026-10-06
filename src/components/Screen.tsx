import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Wraps a screen with the cream background and the top safe-area inset.
 *
 * The design places the orange app bar *below* the status bar rather than
 * behind it, so the inset is applied here rather than inside the app bar.
 */
export function Screen({ children, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});