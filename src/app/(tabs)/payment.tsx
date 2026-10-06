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
import {
  checkout,
  payOrder,
  usePosStore,
  type PaymentMethod,
} from '../../hooks/usePosStore';
import { colors, radius, spacing, text as type } from '../../theme';
import { friendlyDate, peso, to12Hour } from '../../utils/format';

type Tab = 'Pending' | 'Paid';

/** The in-progress basket is payable but not yet an order row. */
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
  lines: { id: number; name: string; quantity: number; unitPrice: number }[];
  total: number;
};

export default function PaymentScreen() {
  const router = useRouter();
  const {
    cart,
    cartCount,
    cartSubtotal,
    draftOrderNumber,
    orders,
  } = usePosStore();

  const [tab, setTab] = useState<Tab>('Pending');
  const [method, setMethod] = useState<PaymentMethod>('Cash');

  /** `null` means "follow the default target"; a value pins the selection. */
  const [selected, setSelected] = useState<string | null>(null);
  /** Cash typed for one target only, so switching targets resets the field. */
  const [receivedFor, setReceivedFor] = useState<{ id: string; value: string } | null>(null);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pending'), [orders]);
  const paidOrders = useMemo(() => orders.filter((order) => order.status === 'paid'), [orders]);
  const hasCart = cart.length > 0;

  // Everything that can still be paid: the POS basket first, then held orders.
  const options = useMemo<PayableTarget[]>(() => {
    const all: PayableTarget[] = [];

    if (hasCart) {
      all.push({
        id: CART_TARGET,
        number: draftOrderNumber,
        createdAt: new Date().toISOString(),
        lines: cart.map((line) => ({
          id: line.id,
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        total: cartSubtotal,
      });
    }

    pendingOrders.forEach((order) => {
      all.push({
        id: String(order.id),
        number: order.number,
        createdAt: order.createdAt,
        lines: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        total: order.total,
      });
    });

    return all;
  }, [hasCart, cart, cartSubtotal, draftOrderNumber, pendingOrders]);

  // A stale `selected` id (e.g. an order that was just paid) falls back to the
  // first option, which is the basket whenever one exists.
  const target = options.find((option) => option.id === selected) ?? options[0] ?? null;
  const total = target?.total ?? 0;

  // Default the field to the exact total; a typed value wins for this target only.
  const received =
    receivedFor && receivedFor.id === target?.id ? receivedFor.value : total.toFixed(2);

  const receivedValue = Number(received) || 0;
  const change = Math.max(0, receivedValue - total);
  const canConfirm = target !== null && receivedValue >= total;

  const setReceived = (value: string) => {
    if (target) setReceivedFor({ id: target.id, value });
  };

  const confirm = () => {
    if (!target || !canConfirm) return;

    if (target.id === CART_TARGET) {
      checkout({ method, amountReceived: receivedValue });
    } else {
      payOrder(Number(target.id), { method, amountReceived: receivedValue });
    }
    router.push('/payment-success');
  };

  const otherTargets =
    tab === 'Pending' ? options.filter((option) => option.id !== target?.id) : [];

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
              <View key={line.id} style={styles.orderLine}>
                <Text style={styles.orderLineItem} numberOfLines={1}>
                  {line.name} × {line.quantity}
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

        {tab === 'Pending' && otherTargets.length > 0 ? (
          <View style={styles.secondaryList}>
            {otherTargets.map((option) => (
              <TargetRow
                key={option.id}
                id={option.id}
                number={option.number}
                createdAt={option.createdAt}
                itemCount={option.lines.reduce((sum, line) => sum + line.quantity, 0)}
                total={option.total}
                isDraft={option.id === CART_TARGET}
                selected={option.id === target?.id}
                onPress={() => setSelected(option.id)}
              />
            ))}
          </View>
        ) : null}

        {tab === 'Paid' && paidOrders.length > 0 ? (
          <View style={styles.secondaryList}>
            {paidOrders.map((order) => (
              <TargetRow
                key={order.id}
                id={String(order.id)}
                number={order.number}
                createdAt={order.createdAt}
                itemCount={order.items.reduce((sum, item) => sum + item.quantity, 0)}
                total={order.total}
                settled
                selected={false}
                onPress={() => setSelected(String(order.id))}
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
                style={[
                  styles.changeValue,
                  change === 0 && receivedValue < total && { color: colors.danger },
                ]}
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

        {cartCount > 0 && tab === 'Pending' ? (
          <Text style={styles.hint}>
            {cartCount} {cartCount === 1 ? 'item is' : 'items are'} still in the basket.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function TargetRow({
  id,
  number,
  createdAt,
  itemCount,
  total,
  settled = false,
  isDraft = false,
  selected,
  onPress,
}: {
  id: string;
  number: string;
  createdAt: string;
  itemCount: number;
  total: number;
  settled?: boolean;
  isDraft?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
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
          {friendlyDate(createdAt)}, {to12Hour(createdAt)} · {itemCount} items
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
  hint: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
