import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SqliteNeedsDeviceNotice } from '../components/SqliteNeedsDeviceNotice';
import { colors } from '../theme';

function AppNavigator() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="payment-success" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* expo-sqlite cannot open a database in a browser, so explain that
          instead of letting the first query throw. */}
      {Platform.OS === 'web' ? <SqliteNeedsDeviceNotice /> : <AppNavigator />}
    </SafeAreaProvider>
  );
}
