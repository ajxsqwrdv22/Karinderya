import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../store/AppState';
import { colors, radius, shadow, spacing, text as type } from '../theme';
import { peso } from '../utils/format';
import { Icon } from './Icon';
import { Divider, PrimaryButton } from './ui';

/**
 * The bottom sheet from the "POS order sheet" frame: a scrim over the POS grid
 * with the cart contents, a discount field and the running total.
 */
export function OrderSheet({
  visible,
  orderNumber,
  onClose,
  onProceed,
}: {
  visible: boolean;
  orderNumber: string;
  onClose: () => void;
  onProceed: () => void;
}) {
  const insets = useSafeAreaInsets();
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartTotal,
    discount,
    nameFor,
    setCartQuantity,
    setDiscount,
  } = useAppState();

  const [code, setCode] = useState('');

  const empty = cart.length === 0;

  const applyDiscount = () => {
    const parsed = Number(code.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) {
      setDiscount(Math.min(parsed, cartSubtotal));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close order sheet"
          style={styles.scrim}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.handle} />

            <View style={styles.titleRow}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>Current Order</Text>
                <Text style={styles.subtitle}>
                  Order #{orderNumber} · {cartCount}{' '}
                  {cartCount === 1 ? 'item' : 'items'}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.close}
              >
                <Icon name="close" size={17} color={colors.text} />
              </Pressable>
            </View>

            <Divider inset={spacing.xxxl} />

            <ScrollView
              style={styles.items}
              contentContainerStyle={styles.itemsContent}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((line) => (
                <View key={`${line.dishId}-${line.note ?? ''}`} style={styles.item}>
                  <View style={styles.itemText}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {nameFor(line.dishId)}
                    </Text>
                    <Text style={styles.itemNote}>{line.note ?? 'Regular'}</Text>
                    <Text style={styles.itemPrice}>
                      {peso(line.unitPrice * line.quantity)}
                    </Text>
                  </View>

                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease ${nameFor(line.dishId)}`}
                      onPress={() => setCartQuantity(line.dishId, line.note, line.quantity - 1)}
                      style={styles.stepButton}
                    >
                      <Icon name="minus" size={14} color={colors.primary} />
                    </Pressable>

                    <Text style={styles.stepValue}>{String(line.quantity)}</Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Increase ${nameFor(line.dishId)}`}
                      onPress={() => setCartQuantity(line.dishId, line.note, line.quantity + 1)}
                      style={[styles.stepButton, styles.stepButtonFilled]}
                    >
                      <Icon name="plus" size={14} color={colors.surface} />
                    </Pressable>
                  </View>
                </View>
              ))}

              {empty ? (
                <Text style={styles.empty}>
                  Nothing added yet. Pick a dish from the grid to start the order.
                </Text>
              ) : null}
            </ScrollView>

            <Divider inset={spacing.xxxl} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{peso(cartSubtotal)}</Text>
            </View>

            <View style={styles.discountField}>
              <Icon name="percent" size={16} color={colors.primary} />
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Add discount or promo code"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.discountInput}
              />
              <Pressable
                accessibilityRole="button"
                onPress={applyDiscount}
                style={styles.discountApply}
              >
                <Text style={styles.discountApplyLabel}>Apply</Text>
              </Pressable>
            </View>

            {discount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  −{peso(discount)}
                </Text>
              </View>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{peso(cartTotal)}</Text>
            </View>

            <PrimaryButton
              label="Proceed to Payment"
              icon="arrow-right"
              disabled={empty}
              onPress={onProceed}
              style={styles.proceed}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheetWrapper: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: 1 },
  title: { ...type.titleMd, color: colors.text },
  subtitle: { ...type.caption, color: colors.textMuted },
  close: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  items: { maxHeight: 200 },
  itemsContent: { gap: spacing.md, paddingVertical: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemText: { flex: 1, gap: 1 },
  itemName: { ...type.titleSm, color: colors.text, fontSize: 12, lineHeight: 14 },
  itemNote: { ...type.caption, color: colors.textMuted },
  itemPrice: { ...type.labelMd, color: colors.primary, fontWeight: '500' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  stepButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stepButtonFilled: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  stepValue: { ...type.titleSm, color: colors.text },

  empty: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { ...type.bodyMd, color: colors.textMuted },
  summaryValue: { ...type.labelMd, color: colors.text },

  discountField: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  discountInput: { flex: 1, ...type.bodyMd, color: colors.text, padding: 0 },
  discountApply: { paddingHorizontal: spacing.xs },
  discountApplyLabel: { ...type.labelMd, color: colors.primary },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { ...type.titleSm, color: colors.text },
  totalValue: { ...type.displayLg, color: colors.primary },

  proceed: { marginTop: spacing.xs },
});