import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBar } from '../components/AppBar';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import {
  Card,
  Divider,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui';
import { MERCHANT_NAME } from '../data/seed';
import { useAppState } from '../store/AppState';
import { colors, radius, spacing, text as type } from '../theme';
import { peso, to12Hour } from '../utils/format';

/**
 * Shown after a payment is confirmed. Reads the receipt from app state so it
 * survives a deep link or a screen reload.
 */
export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { lastReceipt, clearReceipt } = useAppState();

  const receiptNumber = `R-${lastReceipt?.orderNumber ?? '0000'}`;

  return (
    <Screen>
      <AppBar title="Payment" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={46} color={colors.success} />
        </View>

        <View style={styles.message}>
          <Text style={styles.title}>Payment Successful</Text>
          <Text style={styles.description}>
            {lastReceipt?.method ?? 'Cash'} payment recorded for Order #
            {lastReceipt?.orderNumber ?? '—'}
          </Text>
        </View>

        <Card style={styles.receipt}>
          <View style={styles.receiptHead}>
            <View style={styles.identity}>
              <Text style={styles.merchant}>{MERCHANT_NAME}</Text>
              <Text style={styles.receiptMeta}>
                Receipt #{receiptNumber} ·{' '}
                {lastReceipt ? to12Hour(lastReceipt.paidAt) : '—'}
              </Text>
            </View>
            <View style={styles.paidBadge}>
              <Text style={styles.paidLabel}>PAID</Text>
            </View>
          </View>

          <Divider />

          <ReceiptRow label="Order total" value={peso(lastReceipt?.total ?? 0)} />
          <ReceiptRow
            label="Cash received"
            value={peso(lastReceipt?.amountReceived ?? 0)}
          />
          <ReceiptRow
            label="Change"
            value={peso(lastReceipt?.change ?? 0)}
            tone={colors.success}
          />

          <Divider />

          <View style={styles.paidRow}>
            <Text style={styles.paidLabelLarge}>Amount paid</Text>
            <Text style={styles.paidAmount}>{peso(lastReceipt?.total ?? 0)}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <SecondaryButton
            label="Print Receipt"
            icon="printer"
            onPress={() =>
              Alert.alert(
                'Print Receipt',
                'Receipt ' + receiptNumber + ' is ready to print.',
              )
            }
          />
          <PrimaryButton
            label="New Order"
            icon="plus"
            onPress={() => {
              clearReceipt();
              router.replace('/(tabs)/pos');
            }}
          />
        </View>

        <Text style={styles.note}>Transaction saved to today&apos;s sales report</Text>
      </ScrollView>
    </Screen>
  );
}

function ReceiptRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
    gap: spacing.lg,
    alignItems: 'center',
  },

  successIcon: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { alignItems: 'center', gap: spacing.xs },
  title: { ...type.displayMd, color: colors.text },
  description: { ...type.bodyLg, color: colors.textMuted, textAlign: 'center' },

  receipt: { width: '100%', padding: spacing.xxxl, gap: spacing.lg },
  receiptHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  identity: { gap: 2 },
  merchant: { ...type.titleSm, color: colors.text },
  receiptMeta: { ...type.caption, color: colors.textMuted },
  paidBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
  },
  paidLabel: { ...type.labelSm, color: colors.success },

  receiptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { ...type.bodyMd, color: colors.textMuted },
  rowValue: { ...type.titleSm, color: colors.text, fontSize: 12, lineHeight: 14 },

  paidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paidLabelLarge: { ...type.titleSm, color: colors.text },
  paidAmount: { ...type.displayLg, color: colors.primary },

  actions: { width: '100%', gap: spacing.lg },
  note: { ...type.caption, color: colors.textMuted },
});