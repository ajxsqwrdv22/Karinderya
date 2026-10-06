import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppBar, AppBarIcon } from '../../components/AppBar';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Chip, Fab, SegmentedControl } from '../../components/ui';
import { stockFilters } from '../../data/seed';
import type { Ingredient, IngredientStatus } from '../../data/types';
import { useAppState } from '../../store/AppState';
import { colors, radius, shadow, spacing, text as type } from '../../theme';
import { percent, withUnit } from '../../utils/format';

type Tab = 'Ingredients' | 'Dishes';

export default function InventoryScreen() {
  const { ingredients, dishes, restock, imageFor, addToCart } = useAppState();

  const [tab, setTab] = useState<Tab>('Ingredients');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof stockFilters)[number]>('All');

  const filteredIngredients = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return ingredients.filter((ingredient) => {
      const matchesQuery =
        needle.length === 0 || ingredient.name.toLowerCase().includes(needle);
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Low Stock' && ingredient.status === 'low') ||
        (filter === 'Out of Stock' && ingredient.status === 'out');
      return matchesQuery && matchesFilter;
    });
  }, [ingredients, query, filter]);

  const filteredDishes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return dishes.filter(
      (dish) =>
        dish.available &&
        (needle.length === 0 || dish.name.toLowerCase().includes(needle)),
    );
  }, [dishes, query]);

  return (
    <Screen>
      <AppBar
        title="Inventory"
        actions={<AppBarIcon name="search" accessibilityLabel="Search inventory" />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl
          options={['Ingredients', 'Dishes'] as const}
          value={tab}
          onChange={(next) => {
            setTab(next);
            setFilter('All');
          }}
        />

        <View style={styles.searchField}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={tab === 'Ingredients' ? 'Search ingredients' : 'Search dishes'}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>

        {tab === 'Ingredients' ? (
          <View style={styles.filters}>
            {stockFilters.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={filter === option}
                onPress={() => setFilter(option)}
              />
            ))}
          </View>
        ) : null}

        {tab === 'Ingredients' ? (
          <View style={styles.list}>
            {filteredIngredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                onRestock={() => restock(ingredient.id)}
              />
            ))}
            {filteredIngredients.length === 0 ? (
              <Text style={styles.empty}>No ingredients match your filters.</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredDishes.map((dish) => (
              <DishRow
                key={dish.id}
                name={dish.name}
                price={dish.price}
                level={dish.stockLevel}
                image={imageFor(dish.id)}
                onAdd={() => addToCart(dish)}
              />
            ))}
            {filteredDishes.length === 0 ? (
              <Text style={styles.empty}>No dishes match your search.</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <Fab label="Add Item" />
      </View>
    </Screen>
  );
}

const statusMeta: Record<
  IngredientStatus,
  { bar: string; label: string; tone: string; iconBg: string }
> = {
  healthy: {
    bar: colors.success,
    label: 'Stock level is healthy',
    tone: colors.textMuted,
    iconBg: colors.primaryTint,
  },
  low: {
    bar: colors.danger,
    label: 'LOW STOCK',
    tone: colors.danger,
    iconBg: colors.dangerSoft,
  },
  out: {
    bar: colors.track,
    label: 'OUT OF STOCK',
    tone: colors.danger,
    iconBg: colors.dangerSoft,
  },
};

function IngredientRow({
  ingredient,
  onRestock,
}: {
  ingredient: Ingredient;
  onRestock: () => void;
}) {
  const meta = statusMeta[ingredient.status];
  const level = percent(ingredient.quantity, ingredient.parLevel);
  const needsRestock = ingredient.status !== 'healthy';

  return (
    <View style={styles.row}>
      <View style={[styles.itemIcon, { backgroundColor: meta.iconBg }]}>
        <Icon
          name={ingredient.icon as never}
          size={20}
          color={needsRestock ? colors.danger : colors.primary}
        />
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {ingredient.name}
          </Text>
          <Text
            style={[
              styles.itemQuantity,
              needsRestock && { color: colors.danger },
            ]}
          >
            {withUnit(ingredient.quantity, ingredient.unit)}
          </Text>
        </View>

        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${level}%`,
                backgroundColor: meta.bar,
              },
            ]}
          />
        </View>

        <Text style={[styles.itemStatus, { color: meta.tone }]}>{meta.label}</Text>
      </View>

      {needsRestock ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Restock ${ingredient.name}`}
          onPress={onRestock}
          style={({ pressed }) => [styles.restock, pressed && styles.pressed]}
        >
          <Text style={styles.restockLabel}>Restock</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DishRow({
  name,
  price,
  level,
  image,
  onAdd,
}: {
  name: string;
  price: number;
  level: number;
  image: any;
  onAdd: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.itemIcon}>
        <Icon name="utensils" size={20} color={colors.primary} />
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.itemQuantity, { color: colors.primary }]}>
            ₱{price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              { width: `${percent(level, 1)}%`, backgroundColor: colors.success },
            ]}
          />
        </View>

        <Text style={styles.itemStatus}>
          {image ? 'Available' : 'Available'} · {percent(level, 1)}% stock
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${name} to order`}
        onPress={onAdd}
        style={({ pressed }) => [styles.restock, pressed && styles.pressed]}
      >
        <Text style={styles.restockLabel}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 96, gap: spacing.lg },

  searchField: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...type.bodyLg, color: colors.text, padding: 0 },

  filters: { flexDirection: 'row', gap: spacing.md },

  list: { gap: spacing.md },
  empty: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    minHeight: 76,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  itemDetails: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { ...type.titleSm, color: colors.text, flexShrink: 1 },
  itemQuantity: { ...type.titleSm, color: colors.text, fontSize: 12, lineHeight: 14 },

  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  trackFill: { height: 5, borderRadius: radius.pill },

  itemStatus: { fontSize: 9, lineHeight: 11, fontWeight: '500', color: colors.textMuted },

  restock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  restockLabel: { ...type.labelSm, color: colors.primary },
  pressed: { opacity: 0.7 },

  fabWrap: { position: 'absolute', right: spacing.xxxl, bottom: spacing.xl, alignItems: 'flex-end' },
});