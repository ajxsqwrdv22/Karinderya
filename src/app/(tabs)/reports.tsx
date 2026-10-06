import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBar, AppBarIcon } from '../../components/AppBar';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import {
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from '../../components/ui';
import { useProducts } from '../../hooks/useProducts';
import { usePosStore } from '../../hooks/usePosStore';
import { colors, radius, shadow, spacing, text as type } from '../../theme';
import { peso, pesoCompact } from '../../utils/format';

type Range = 'Today' | 'This Week' | 'This Month' | 'Custom';

const RANGES: Range[] = ['Today', 'This Week', 'This Month', 'Custom'];

/** Expenses are not modelled in the schema, so they are shown as an estimate. */
const EXPENSE_RATIO: Record<Range, number> = {
  Today: 0.59,
  'This Week': 0.59,
  'This Month': 0.6,
  Custom: 0.59,
};

export default function ReportsScreen() {
  const { products } = useProducts();
  const { totals } = usePosStore();
  const [range, setRange] = useState<Range>('This Week');

  const lowStock = useMemo(
    () => products.filter((product) => product.stock < product.par_level),
    [products],
  );

  const sales = totals.todaySales;
  const expenses = Math.round(sales * EXPENSE_RATIO[range]);
  const net = sales - expenses;
  const expenseShare = sales > 0 ? Math.round((expenses / sales) * 100) : 0;

  // Bars are scaled against the busiest method so the chart stays readable.
  const methods = totals.salesByMethod;
  const peak = Math.max(1, ...methods.map((bucket) => bucket.amount));

  return (
    <Screen>
      <AppBar
        title="Reports"
        actions={<AppBarIcon name="calendar" accessibilityLabel="Pick date range" />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ranges}
        >
          {RANGES.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={range === option}
              onPress={() => setRange(option)}
            />
          ))}
        </ScrollView>

        <View style={styles.summaryRow}>
          <SummaryTile
            icon="trend-up"
            iconColor={colors.primary}
            label="Total Sales"
            value={peso(sales)}
            comparison={`${totals.todayOrders} paid orders`}
            valueColor={colors.primary}
          />
          <SummaryTile
            icon="trend-down"
            iconColor={colors.danger}
            label="Expenses"
            value={peso(expenses)}
            comparison={`${expenseShare}% of sales`}
            valueColor={colors.danger}
          />
          <SummaryTile
            icon="peso"
            iconColor={colors.success}
            label="Net Income"
            value={peso(net)}
            comparison={`${totals.dishesSold} dishes sold`}
            valueColor={colors.success}
          />
        </View>

        {/* Sales by payment method */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>SALES BY METHOD</SectionTitle>
            <Text style={styles.periodTotal}>{pesoCompact(sales)}</Text>
          </View>

          {methods.length === 0 ? (
            <Text style={styles.empty}>No payments recorded yet.</Text>
          ) : (
            methods.map((bucket) => (
              <View key={bucket.method} style={styles.methodRow}>
                <Text style={styles.methodLabel}>{bucket.method}</Text>
                <View style={styles.methodTrack}>
                  <View
                    style={[
                      styles.methodFill,
                      { width: `${Math.round((bucket.amount / peak) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.methodAmount}>{peso(bucket.amount)}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Best selling dishes */}
        <Card style={styles.block}>
          <SectionTitle>BEST SELLING DISHES</SectionTitle>

          {totals.topSelling.length === 0 ? (
            <Text style={styles.empty}>No sales recorded yet.</Text>
          ) : (
            totals.topSelling.slice(0, 5).map((dish, index) => (
              <View key={dish.name} style={styles.rankedRow}>
                <View style={[styles.rank, index === 0 && styles.rankFirst]}>
                  <Text style={[styles.rankNumber, index === 0 && styles.rankNumberFirst]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.dishName} numberOfLines={1}>
                  {dish.name}
                </Text>
                <Text style={styles.dishQuantity}>{dish.servings} sold</Text>
              </View>
            ))
          )}
        </Card>

        {/* Low stock */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>LOW STOCK REPORT</SectionTitle>
            <Text style={styles.lowCount}>{lowStock.length} ITEMS</Text>
          </View>

          {lowStock.length === 0 ? (
            <Text style={styles.empty}>Everything is at or above par level.</Text>
          ) : (
            lowStock.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.lowRow}>
                <Icon name="alert" size={14} color={colors.danger} />
                <Text style={styles.lowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.lowQuantity}>
                  {item.stock} {item.unit}
                </Text>
              </View>
            ))
          )}
        </Card>

        <View style={styles.actions}>
          <SecondaryButton
            label="Export PDF"
            icon="file"
            onPress={() =>
              Alert.alert('Export PDF', `Preparing the ${range.toLowerCase()} report.`)
            }
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Share"
            icon="share"
            onPress={() =>
              Alert.alert('Share', `Sharing the ${range.toLowerCase()} report.`)
            }
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function SummaryTile({
  icon,
  iconColor,
  label,
  value,
  comparison,
  valueColor,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  comparison: string;
  valueColor: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileLabelRow}>
        <Icon name={icon} size={14} color={iconColor} />
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.tileValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.tileComparison} numberOfLines={1}>
        {comparison}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },

  ranges: { gap: spacing.sm, paddingRight: spacing.xl },

  summaryRow: { flexDirection: 'row', gap: 7 },
  tile: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadow.card,
  },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tileLabel: { fontSize: 9, lineHeight: 11, color: colors.textMuted, flex: 1 },
  tileValue: { fontSize: 13, lineHeight: 15, fontWeight: '700' },
  tileComparison: { fontSize: 8, lineHeight: 10, color: colors.textMuted },

  block: { padding: spacing.xl, gap: spacing.md },
  empty: { ...type.caption, color: colors.textMuted, paddingVertical: spacing.sm },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodTotal: { ...type.labelSm, color: colors.primary },

  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  methodLabel: { ...type.bodySm, color: colors.text, width: 52 },
  methodTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  methodFill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.primary },
  methodAmount: {
    ...type.labelSm,
    color: colors.text,
    width: 74,
    textAlign: 'right',
  },

  rankedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rank: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankFirst: { backgroundColor: colors.primarySoft },
  rankNumber: { ...type.labelSm, color: colors.textMuted },
  rankNumberFirst: { color: colors.primary },
  dishName: { ...type.bodyMd, color: colors.text, flex: 1 },
  dishQuantity: { ...type.labelSm, color: colors.textMuted },

  lowCount: { ...type.labelSm, color: colors.danger },
  lowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lowName: { ...type.bodyMd, color: colors.text, flex: 1 },
  lowQuantity: { ...type.labelSm, color: colors.danger },

  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1, paddingHorizontal: 0 },
});
