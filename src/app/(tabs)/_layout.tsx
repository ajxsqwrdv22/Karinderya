import React from 'react';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';

import { TabBar, TabButton } from '../../components/TabBar';

/**
 * Headless tab navigator (Expo Router SDK 57 `expo-router/ui`).
 *
 * `TabList` is configured with bare `TabTrigger`s that declare the routes;
 * `asChild` swaps in the hand-built bar so the navigation matches the Figma
 * design rather than the stock React Navigation tab bar.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />

      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="dashboard" label="Dashboard" />
          </TabTrigger>

          <TabTrigger name="inventory" href="/inventory" asChild>
            <TabButton icon="package" label="Inventory" />
          </TabTrigger>

          <TabTrigger name="pos" href="/pos" asChild>
            <TabButton icon="basket" label="POS" />
          </TabTrigger>

          <TabTrigger name="payment" href="/payment" asChild>
            <TabButton icon="wallet" label="Payment" />
          </TabTrigger>

          <TabTrigger name="reports" href="/reports" asChild>
            <TabButton icon="chart" label="Reports" />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}