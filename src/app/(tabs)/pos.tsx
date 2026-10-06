import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBar, AppBarIcon, OrderChip } from '../../components/AppBar';
import { Icon } from '../../components/Icon';
import { OrderSheet } from '../../components/OrderSheet';
import { Screen } from '../../components/Screen';
import { Chip } from '../../components/ui';
import { dishCategories } from '../../data/seed';
import type { Dish } from '../../data/types';
import { useAppState } from '../../store/AppState';
import { colors, radius, shadow, spacing, text as type } from '../../theme';
import { peso } from '../../utils/format';

type Category = (typeof dishCategories)[number];

export default function PosScreen() {
  const router = useRouter();
  const { dishes, cartCount, cartTotal, nextOrderNumber, addToCart, imageFor } =
    useAppState();

  const [category, setCategory] = useState<Category>('All');
  const [sheetOpen, setSheetOpen] = useState(false);

  const orderNumber = String(nextOrderNumber - 1).padStart(4, '0');

  const visibleDishes = useMemo(
    () =>
      category === 'All'
        ? dishes
        : dishes.filter((dish) => dish.category === category),
    [dishes, category],
  );

  // Two fixed-width columns, matching the 164px cards in the design.
  const rows: Dish[][] = [];
  for (let i = 0; i < visibleDishes.length; i += 2) {
    rows.push(visibleDishes.slice(i, i + 2));
  }

  return (
    <Screen>
      <AppBar
        title="POS"
        actions={
          <>
            <OrderChip number={orderNumber} />
            <AppBarIcon name="more" accessibilityLabel="More options" />
          </>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {dishCategories.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={category === option}
              onPress={() => setCategory(option)}
            />
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.dishRow}>
              {row.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  image={imageFor(dish.id)}
                  onAdd={() => addToCart(dish)}
                />
              ))}
              {row.length === 1 ? <View style={styles.dishCardSpacer} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky "Current order" summary */}
      <View style={styles.summaryWrap} pointerEvents="box-none">
        <View style={styles.summary}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>
              Current Order · {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.summaryAmount}>{peso(cartTotal)}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setSheetOpen(true)}
            style={({ pressed }) => [styles.reviewButton, pressed && styles.pressed]}
          >
            <Text style={styles.reviewLabel}>Review Order</Text>
          </Pressable>
        </View>
      </View>

      <OrderSheet
        visible={sheetOpen}
        orderNumber={orderNumber}
        onClose={() => setSheetOpen(false)}
        onProceed={() => {
          setSheetOpen(false);
          router.push('/payment');
        }}
      />
    </Screen>
  );
}

function DishCard({
  dish,
  image,
  onAdd,
}: {
  dish: Dish;
  image: any;
  onAdd: () => void;
}) {
  const soldOut = !dish.available;

  return (
    <View style={styles.dishCard}>
      <View style={styles.dishMedia}>
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {soldOut ? (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.dishName} numberOfLines={1}>
        {dish.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.dishPrice}>{peso(dish.price)}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={soldOut ? `${dish.name} is sold out` : `Add ${dish.name}`}
          disabled={soldOut}
          onPress={onAdd}
          style={({ pressed }) => [
            styles.addButton,
            soldOut && styles.addButtonDisabled,
            pressed && !soldOut && styles.pressed,
          ]}
        >
          <Icon
            name="plus"
            size={12}
            color={soldOut ? colors.textFaint : colors.primary}
          />
          <Text style={[styles.addLabel, soldOut && styles.addLabelDisabled]}>
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 0, gap: spacing.lg },

  categories: { gap: spacing.sm, paddingRight: spacing.xl },

  grid: { gap: spacing.md },
  dishRow: { flexDirection: 'row', gap: spacing.md },
  dishCardSpacer: { flex: 1 },

  dishCard: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  dishMedia: {
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  soldOutBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  soldOutText: { ...type.caption, color: colors.surface, fontWeight: '700' },

  dishName: { ...type.labelMd, color: colors.text, marginTop: 5 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  dishPrice: { ...type.titleSm, color: colors.primary, fontSize: 12, lineHeight: 14 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
  },
  addButtonDisabled: { backgroundColor: colors.neutralSoft },
  addLabel: { fontSize: 9, lineHeight: 11, fontWeight: '700', color: colors.primary },
  addLabelDisabled: { color: colors.textFaint },

  summaryWrap: { padding: spacing.xl, paddingTop: spacing.md },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  summaryText: { flex: 1, gap: 1 },
  summaryLabel: { ...type.caption, color: colors.textMuted },
  summaryAmount: { ...type.titleMd, color: colors.text },

  reviewButton: {
    height: 48,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  reviewLabel: { ...type.titleSm, color: colors.surface },
  pressed: { opacity: 0.75 },
});