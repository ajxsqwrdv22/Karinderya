import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBar, AppBarIcon } from '../../components/AppBar';
import { Icon, type IconName } from '../../components/Icon';
import {
  ProductFormModal,
  type DraftProduct,
} from '../../components/ProductFormModal';
import { Screen } from '../../components/Screen';
import { Chip, Fab, SegmentedControl } from '../../components/ui';
import { useProducts, type ProductRow } from '../../hooks/useProducts';
import {
  addProduct,
  changeStock,
  editProduct,
  removeProduct,
} from '../../services/catalogueStore';
import { colors, radius, shadow, spacing, text as type } from '../../theme';
import { percent } from '../../utils/format';

type Tab = 'Ingredients' | 'Dishes';

/** Menu categories, as opposed to the single "Ingredients" category. */
const DISH_CATEGORIES = ['Ulam', 'Rice', 'Soup', 'Drinks', 'Extras'];
const STOCK_FILTERS = ['All', 'Low Stock', 'Out of Stock'] as const;

export default function InventoryScreen() {
  const { products, query, search } = useProducts();

  const [tab, setTab] = useState<Tab>('Ingredients');
  const [stockFilter, setStockFilter] = useState<(typeof STOCK_FILTERS)[number]>('All');
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  /** The segmented control maps onto a SQL category filter. */
  const visible = useMemo(() => {
    const inTab =
      tab === 'Ingredients'
        ? products.filter((product) => product.category === 'Ingredients')
        : products.filter((product) => DISH_CATEGORIES.includes(product.category));

    if (tab === 'Dishes' || stockFilter === 'All') return inTab;

    return inTab.filter((product) =>
      stockFilter === 'Low Stock'
        ? product.stock < product.par_level && product.stock > 0
        : product.stock === 0,
    );
  }, [products, tab, stockFilter]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((product: ProductRow) => {
    setEditing(product);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  const handleSubmit = useCallback(
    (draft: DraftProduct) => {
      const input = {
        name: draft.name.trim(),
        category: draft.category,
        price: Number(draft.price),
        stock: Number(draft.stock),
        unit: draft.unit,
        parLevel: draft.parLevel.trim() === '' ? Number(draft.stock) : Number(draft.parLevel),
      };

      if (editing) {
        editProduct(editing.id, input);
      } else {
        addProduct(input);
      }
      closeForm();
    },
    [editing, closeForm],
  );

  /** Step 5 of the lab: confirm, then DELETE the row. */
  const confirmDelete = useCallback((product: ProductRow) => {
    Alert.alert(
      'Delete item',
      `Remove ${product.name} from the database? Past sales keep their record.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeProduct(product.id),
        },
      ],
    );
  }, []);

  const restockAll = useCallback(() => {
    Alert.alert('Restock', `Top every low item up to its par level?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restock',
        onPress: () =>
          products
            .filter((product) => product.stock < product.par_level)
            .forEach((product) => changeStock(product.id, product.par_level - product.stock)),
      },
    ]);
  }, [products]);

  return (
    <Screen>
      <AppBar
        title="Inventory"
        actions={<AppBarIcon name="search" accessibilityLabel="Search inventory" />}
      />

      <View style={styles.controls}>
        <SegmentedControl
          options={['Ingredients', 'Dishes'] as const}
          value={tab}
          onChange={(next) => {
            setTab(next);
            setStockFilter('All');
          }}
        />

        <View style={styles.searchField}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={search}
            placeholder="Search by name or category (SQL LIKE)"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => search('')}
            >
              <Icon name="close" size={16} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>

        {tab === 'Ingredients' ? (
          <View style={styles.filters}>
            {STOCK_FILTERS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={stockFilter === option}
                onPress={() => setStockFilter(option)}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Step 3 of the lab: rows come straight out of SQL into a FlatList. */}
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            isDish={tab === 'Dishes'}
            onAdjust={(delta) => changeStock(item.id, delta)}
            onEdit={() => openEdit(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {query.length > 0
                ? `No rows match “${query}”.`
                : 'No rows in this category yet.'}
            </Text>
          </View>
        }
      />

      <View style={styles.fabWrap} pointerEvents="box-none">
        <Fab label="Add Item" onPress={openCreate} />
      </View>

      {tab === 'Ingredients' && products.some((p) => p.stock < p.par_level) ? (
        <Pressable
          accessibilityRole="button"
          onPress={restockAll}
          style={styles.restockAll}
        >
          <Icon name="check" size={12} color={colors.primary} />
          <Text style={styles.restockAllLabel}>Restock all</Text>
        </Pressable>
      ) : null}

      <ProductFormModal
        visible={formOpen}
        initial={
          editing
            ? {
                name: editing.name,
                category: editing.category,
                price: String(editing.price),
                stock: String(editing.stock),
                unit: editing.unit,
                parLevel: String(editing.par_level),
              }
            : null
        }
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

function ProductCard({
  product,
  isDish,
  onAdjust,
  onEdit,
  onDelete,
}: {
  product: ProductRow;
  isDish: boolean;
  onAdjust: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const level = percent(product.stock, product.par_level);
  const out = product.stock === 0;
  const low = !out && level < 100;
  const healthy = !out && !low;

  const statusText = out
    ? 'OUT OF STOCK'
    : low
      ? `LOW STOCK · ${level}% of par`
      : 'Stock level is healthy';

  const statusColor = healthy ? colors.textMuted : colors.danger;
  const iconBg = healthy ? colors.primaryTint : colors.dangerSoft;
  const iconColor = healthy ? colors.primary : colors.danger;

  const icon: IconName = isDish
    ? 'utensils'
    : product.category === 'Ingredients'
      ? 'package'
      : 'utensils';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={[styles.itemQuantity, (out || low) && { color: colors.danger }]}>
              {product.stock} {product.unit}
            </Text>
          </View>

          <Text style={styles.itemMeta}>
            {product.category}
            {isDish ? ` · ₱${product.price.toFixed(2)}` : ''}
          </Text>

          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                {
                  width: `${level}%`,
                  backgroundColor: out
                    ? colors.track
                    : healthy
                      ? colors.success
                      : colors.danger,
                },
              ]}
            />
          </View>

          <Text style={[styles.itemStatus, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {/* Bonus criterion: +/- stock straight against the row. */}
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${product.name} stock`}
            onPress={() => onAdjust(-1)}
            style={styles.stepButton}
          >
            <Icon name="minus" size={14} color={colors.primary} />
          </Pressable>
          <Text style={styles.stepValue}>{product.stock}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${product.name} stock`}
            onPress={() => onAdjust(1)}
            style={[styles.stepButton, styles.stepButtonFilled]}
          >
            <Icon name="plus" size={14} color={colors.surface} />
          </Pressable>
        </View>

        {/* The "add to order" action is intentionally absent here: the POS cart
            still reads from the Lab 04 store until Phase 2 moves it to SQLite,
            and a button that wrote to a different store than POS reads would
            look broken in a demo. */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${product.name}`}
          onPress={onEdit}
          style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
        >
          <Icon name="receipt" size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${product.name}`}
          onPress={onDelete}
          style={({ pressed }) => [styles.iconAction, styles.deleteAction, pressed && styles.pressed]}
        >
          <Icon name="close" size={16} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { padding: spacing.xl, gap: spacing.lg },
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

  list: { paddingHorizontal: spacing.xl, paddingBottom: 110, gap: spacing.md },

  card: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: { flex: 1, gap: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: { ...type.titleSm, color: colors.text, flexShrink: 1 },
  itemQuantity: { ...type.titleSm, color: colors.text, fontSize: 12, lineHeight: 14 },
  itemMeta: { ...type.caption, color: colors.textMuted },

  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  trackFill: { height: 5, borderRadius: radius.pill },
  itemStatus: { fontSize: 9, lineHeight: 11, fontWeight: '500' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  stepValue: {
    ...type.labelMd,
    color: colors.text,
    minWidth: 18,
    textAlign: 'center',
  },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSoft,
  },
  deleteAction: { backgroundColor: colors.dangerSoft },

  empty: { paddingVertical: spacing.xxxl, alignItems: 'center' },
  emptyText: { ...type.bodyMd, color: colors.textMuted, textAlign: 'center' },

  restockAll: {
    position: 'absolute',
    left: spacing.xl,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadow.card,
  },
  restockAllLabel: { ...type.labelSm, color: colors.primary },

  fabWrap: { position: 'absolute', right: spacing.xxxl, bottom: spacing.xl, alignItems: 'flex-end' },
  pressed: { opacity: 0.75 },
});
