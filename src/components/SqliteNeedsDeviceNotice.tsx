import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, text as type } from '../theme';

/**
 * Shown instead of the app on platforms where `expo-sqlite` cannot run.
 *
 * On web, SQLite is compiled to WebAssembly and needs `SharedArrayBuffer`, which
 * browsers only expose when the page sends `Cross-Origin-Opener-Policy` and
 * `Cross-Origin-Embedder-Policy` headers. The Expo dev server does not send
 * them, so the database cannot be opened in a browser at all.
 *
 * This is a platform limitation rather than an app bug: the same code runs
 * normally on Android and iOS through Expo Go.
 */
export function SqliteNeedsDeviceNotice() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>expo-sqlite</Text>
      </View>

      <Text style={styles.title}>Run this on a device</Text>

      <Text style={styles.body}>
        This app stores everything in an on-device SQLite database. In a web
        browser, SQLite is compiled to WebAssembly and needs
        {'SharedArrayBuffer'}, which browsers only provide when the page sends
        strict cross-origin isolation headers. The Expo dev server does not
        send those, so the database cannot be opened here.
      </Text>

      <View style={styles.steps}>
        <Step index={1} text="Run `npx expo start` in the project folder." />
        <Step index={2} text="Install Expo Go on your Android phone." />
        <Step index={3} text="Scan the QR code in the terminal with the phone camera." />
        <Step index={4} text="The database seeds itself on first launch." />
      </View>

      <Text style={styles.footnote}>
        The database file, the schema and every query are unchanged — this is
        only about the platform you are previewing on.
      </Text>
    </ScrollView>
  );
}

function Step({ index, text }: { index: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.xl,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  badgeText: { ...type.labelSm, color: colors.primary },

  title: { ...type.displayMd, color: colors.text },
  body: { ...type.bodyLg, color: colors.textMuted, lineHeight: 22 },

  steps: { gap: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: { ...type.labelSm, color: colors.surface },
  stepText: { ...type.bodyMd, color: colors.text, flex: 1, lineHeight: 20 },

  footnote: { ...type.caption, color: colors.textFaint, lineHeight: 15 },
});
