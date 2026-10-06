import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBar, AppBarIcon } from '../../components/AppBar';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import {
  Badge,
  Card,
  Chip,
  Divider,
  PrimaryButton,
  SegmentedControl,
  SectionTitle,
} from '../../components/ui';
import type { Order, PaymentMethod } from '../../data/types';
import { useAppState } from '../../store/AppState';
import { colors, radius, spacing, text as type } from '../../theme';
import { friendlyDate, peso, to12Hour } from '../../utils/format';

type Tab = 'Pending' | 'Paid';

/** The in-progress POS order behaves like an order awaiting payment. */
const CART_TARGET = 'cart';

const METHODS: { method: PaymentMethod; icon: IconName }[] = [
  { method: 'Cash', icon: 'cash' },
  { method: 'GCash', icon: 'phone' },
  { method: 'Maya', icon: 'card' },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000];

type PayableTarget = {
  id: string;
  number: string;
  createdAt: string;
  lines: Order['lines'];
  total: number;
};

export default function PaymentScreen() {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    pendingOrders,
    paidOrders,
    nextOrderNumber,
    nameFor,
    checkout,
    payPendingOrder,
  } = useAppState();

  const [tab, setTab] = useState<Tab>('Pending');
  const [method, setMethod] = useState<PaymentMethod>('Cash');

  /** `null` means "follow the default target"; a value pins the selection. */
  const [selected, setSelected] = useState<string | null>(null);
  /** Cash typed for a specific target, so switching targets resets the field. */
  const [receivedFor, setReceivedFor] = useState<{ id: string; value: string } | null>(null);

  const cartOrderNumber = String(nextOrderNumber - 1).padStart(4, '0');
  const hasCart = cart.length > 0;

  // Stable timestamp so the cart order does not change on every render.
  const [cartCreatedAt] = useState(() => new Date().toISOString());

  // Every order that can still be paid: the in-progress POS order first, then
  // any orders already recorded as pending.
  const options = useMemo<PayableTarget[]>(() => {
    const all: PayableTarget[] = [];

    if (hasCart) {
      all.push({
        id: CART_TARGET,
        number: cartOrderNumber,
        createdAt: cartCreatedAt,
        lines: cart,
        total: cartTotal,
      });
    }

    pendingOrders.forEach((order) => {
      all.push({
        id: order.id,
        number: order.number,
        createdAt: order.createdAt,
        lines: order.lines,
        total: order.total,
      });
    });

    return all;
  }, [hasCart, cart, cartTotal, cartOrderNumber, cartCreatedAt, pendingOrders]);

  // A stale `selected` id (e.g. an order that was just paid) falls back to the
  // first option, which is the POS cart whenever one exists.
  const target =
    options.find((option) => option.id === selected) ?? options[0] ?? null;

  const total = target?.total ?? 0;

  // Default the field to the exact total; a typed value wins for this target only.
  const received =
    receivedFor && receivedFor.id === target?.id
      ? receivedFor.value
      : total.toFixed(2);

  const receivedValue = Number(received) || 0;
  const change = Math.max(0, receivedValue - total);
  const canConfirm = target !== null && receivedValue >= total;

  const setReceived = (value: string) => {
    if (target) setReceivedFor({ id: target.id, value });
  };

  const confirm = () => {
    if (!target || !canConfirm) return;

    if (target.id === CART_TARGET) {
      checkout(method, receivedValue);
    } else {
      payPendingOrder(target.id, method, receivedValue);
    }
    router.push('/payment-success');
  };

  // The Pending tab lists the other payable orders (including the POS cart, so it
  // stays reachable once an older order has been selected); Paid lists history.
  const others =
    tab === 'Pending'
      ? options.filter((option) => option.id !== target?.id)
      : paidOrders;

  return (
    <Screen>
      <AppBar
        title="Payment"
        actions={<AppBarIcon name="more" accessibilityLabel="More options" />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl options={['Pending', 'Paid'] as const} value={tab} onChange={setTab} />

        {/* Order awaiting payment */}
        {target ? (
          <Card style={styles.orderCard}>
            <View style={styles.orderHead}>
              <View style={styles.orderIdentity}>
                <Text style={styles.orderNumber}>Order #{target.number}</Text>
                <Text style={styles.orderTimestamp}>
                  {friendlyDate(target.createdAt)}, {to12Hour(target.createdAt)} ·{' '}
                  {target.lines.reduce((sum, line) => sum + line.quantity, 0)} items
                </Text>
              </View>
              <Badge label="Pending" tone="pending" />
            </View>

            <Divider />

            {target.lines.map((line) => (
              <View key={`${line.dishId}-${line.note ?? ''}`} style={styles.orderLine}>
                <Text style={styles.orderLineItem} numberOfLines={1}>
                  {nameFor(line.dishId)} × {line.quantity}
                </Text>
                <Text style={styles.orderLineAmount}>
                  {peso(line.unitPrice * line.quantity)}
                </Text>
              </View>
            ))}

            <Divider />

            <View style={styles.orderTotalRow}>
              <Text style={styles.orderTotalLabel}>Total</Text>
              <Text style={styles.orderTotalValue}>{peso(total)}</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {tab === 'Pending'
                ? 'Nothing to pay yet. Add dishes in the POS tab or wait for a pending order.'
                : 'No payments recorded yet.'}
            </Text>
          </Card>
        )}

        {/* Other orders in the current tab */}
        {others.length > 0 ? (
          <View style={styles.secondaryList}>
            {tab === 'Pending'
              ? others.map((option) => (
                  <OrderRow
                    key={option.id}
                    target={option}
                    isDraft={option.id === CART_TARGET}
                    selected={option.id === target?.id}
                    onPress={() => setSelected(option.id)}
                  />
                ))
              : paidOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    selected={false}
                    onPress={() => setSelected(order.id)}
                  />
                ))}
          </View>
        ) : null}

        <SectionTitle>PAYMENT METHOD</SectionTitle>

        <View style={styles.methods}>
          {METHODS.map((option) => {
            const active = method === option.method;
            return (
              <Pressable
                key={option.method}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setMethod(option.method)}
                style={({ pressed }) => [
                  styles.method,
                  active && styles.methodActive,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  name={option.icon}
                  size={16}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={styles.methodLabel}>{option.method}</Text>
                <View style={[styles.radio, active && styles.radioActive]} />
              </Pressable>
            );
          })}
        </View>

        {method === 'Cash' ? (
          <Card style={styles.cashCard}>
            <View style={styles.receivedField}>
              <Text style={styles.receivedPrefix}>₱</Text>
              <View style={styles.receivedText}>
                <Text style={styles.receivedLabel}>Amount Received</Text>
                <TextInput
                  value={received}
                  onChangeText={setReceived}
                  keyboardType="decimal-pad"
                  style={styles.receivedInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            </View>

            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((amount) => (
                <Chip
                  key={amount}
                  label={`₱${amount.toLocaleString('en-PH')}`}
                  selected={receivedValue === amount}
                  onPress={() => setReceived(amount.toFixed(2))}
                />
              ))}
            </View>

            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text
                style={[styles.changeValue, change === 0 && receivedValue < total && { color: colors.danger }]}
              >
                {peso(change)}
              </Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.cashCard}>
            <Text style={styles.walletNote}>
              {method} payment of {peso(total)} will be recorded for Order #
              {target?.number ?? '—'}.
            </Text>
          </Card>
        )}

        <PrimaryButton
          label="Confirm Payment"
          icon="check"
          disabled={!canConfirm}
          onPress={confirm}
        />
      </ScrollView>
    </Screen>
  );
}

type OrderRowProps = {
  selected: boolean;
  onPress: () => void;
  /** A still-payable order: the POS cart or a pending order. */
  target?: PayableTarget;
  /** An already-settled order from history. */
  order?: Order;
  /** Marks the in-progress POS order so it reads differently from a held order. */
  isDraft?: boolean;
};

function OrderRow({ target, order, isDraft, selected, onPress }: OrderRowProps) {
  const number = target?.number ?? order?.number ?? '—';
  const createdAt = target?.createdAt ?? order?.createdAt;
  const lines = target?.lines ?? order?.lines ?? [];
  const total = target?.total ?? order?.total ?? 0;
  const settled = Boolean(order);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryRow,
        selected && styles.secondaryRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.secondaryText}>
        <Text style={styles.secondaryNumber} numberOfLines={1}>
          {isDraft ? 'Current order' : `Order #${number}`}
        </Text>
        <Text style={styles.secondaryMeta} numberOfLines={1}>
          {createdAt ? `${friendlyDate(createdAt)}, ${to12Hour(createdAt)} · ` : ''}
          {lines.reduce((sum, line) => sum + line.quantity, 0)} items
        </Text>
      </View>
      <View style={styles.secondaryRight}>
        <Text style={styles.secondaryAmount}>{peso(total)}</Text>
        <Badge
          label={settled ? 'Paid' : isDraft ? 'Draft' : 'Pending'}
          tone={settled ? 'paid' : isDraft ? 'neutral' : 'pending'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },

  orderCard: { padding: spacing.xl, gap: 7 },
  orderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderIdentity: { gap: 1 },
  orderNumber: { ...type.titleSm, color: colors.text },
  orderTimestamp: { ...type.caption, color: colors.textMuted },

  orderLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  orderLineItem: { ...type.bodyMd, color: colors.textMuted, flex: 1 },
  orderLineAmount: { ...type.labelMd, color: colors.text, fontWeight: '500' },

  orderTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderTotalLabel: { ...type.titleSm, color: colors.text },
  orderTotalValue: { ...type.displayMd, color: colors.primary },

  emptyCard: { padding: spacing.xxxl, alignItems: 'center' },
  emptyText: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center' },

  secondaryList: { gap: spacing.md },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryRowSelected: { borderColor: colors.primary },
  secondaryText: { flex: 1, gap: 1 },
  secondaryNumber: { ...type.titleSm, color: colors.text, fontSize: 13, lineHeight: 15 },
  secondaryMeta: { ...type.caption, color: colors.textMuted },
  secondaryRight: { alignItems: 'flex-end', gap: 4 },
  secondaryAmount: { ...type.titleSm, color: colors.primary, fontSize: 13, lineHeight: 15 },

  methods: { flexDirection: 'row', gap: 7 },
  method: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  methodLabel: { ...type.caption, color: colors.text, fontWeight: '500', flex: 1 },
  radio: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.textFaint,
    backgroundColor: colors.surface,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },

  cashCard: { padding: spacing.xl, gap: spacing.md },
  receivedField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  receivedPrefix: { ...type.titleSm, color: colors.primary },
  receivedText: { flex: 1 },
  receivedLabel: { fontSize: 8, lineHeight: 10, color: colors.textMuted },
  receivedInput: { ...type.titleSm, color: colors.text, padding: 0 },

  quickRow: { flexDirection: 'row', gap: 5 },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  changeLabel: { ...type.bodyMd, color: colors.textMuted },
  changeValue: { ...type.titleMd, color: colors.success },

  walletNote: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  pressed: { opacity: 0.75 },
});