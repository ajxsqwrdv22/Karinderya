import React, { useState } from 'react';
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
import { bestSellingWeek, seedSalesTrend } from '../../data/seed';
import { useAppState } from '../../store/AppState';
import { colors, radius, shadow, spacing, text as type } from '../../theme';
import { peso, pesoCompact } from '../../utils/format';

type Range = 'Today' | 'This Week' | 'This Month' | 'Custom';

const RANGES: Range[] = ['Today', 'This Week', 'This Month', 'Custom'];

/** Totals shown per selected range. Only "This Week" has data in the mockup. */
const SUMMARY_BY_RANGE: Record<Range, { sales: number; expenses: number }> = {
  Today: { sales: 8450, expenses: 4980 },
  'This Week': { sales: 52300, expenses: 31000 },
  'This Month': { sales: 214700, expenses: 128400 },
  Custom: { sales: 52300, expenses: 31000 },
};

export default function ReportsScreen() {
  const { lowStockIngredients, outOfStockIngredients } = useAppState();
  const [range, setRange] = useState<Range>('This Week');

  const summary = SUMMARY_BY_RANGE[range];
  const net = summary.sales - summary.expenses;
  const expenseShare = Math.round((summary.expenses / summary.sales) * 100);

  const peak = Math.max(...seedSalesTrend.map((point) => point.amount));

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

        {/* Summary tiles */}
        <View style={styles.summaryRow}>
          <SummaryTile
            icon="trend-up"
            iconColor={colors.primary}
            label="Total Sales"
            value={peso(summary.sales)}
            comparison="+12.4% vs last week"
            valueColor={colors.primary}
          />
          <SummaryTile
            icon="trend-down"
            iconColor={colors.danger}
            label="Expenses"
            value={peso(summary.expenses)}
            comparison={`${expenseShare}% of sales`}
            valueColor={colors.danger}
          />
          <SummaryTile
            icon="peso"
            iconColor={colors.success}
            label="Net Income"
            value={peso(net)}
            comparison="+12.4% vs last week"
            valueColor={colors.success}
          />
        </View>

        {/* Sales trend */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>SALES TREND</SectionTitle>
            <Text style={styles.periodTotal}>{pesoCompact(summary.sales)}</Text>
          </View>

          <View style={styles.chart}>
            {seedSalesTrend.map((point, index) => {
              const height = Math.max(4, (point.amount / peak) * 66);
              return (
                <View key={`${point.label}-${index}`} style={styles.column}>
                  <View
                    style={[
                      styles.bar,
                      { height },
                      point.current ? styles.barCurrent : null,
                    ]}
                  />
                  <Text
                    style={[styles.day, point.current && styles.dayCurrent]}
                  >
                    {point.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Best selling dishes */}
        <Card style={styles.block}>
          <SectionTitle>BEST SELLING DISHES</SectionTitle>

          {bestSellingWeek.map((dish, index) => (
            <View key={dish.dishId} style={styles.rankedRow}>
              <View style={[styles.rank, index === 0 && styles.rankFirst]}>
                <Text
                  style={[styles.rankNumber, index === 0 && styles.rankNumberFirst]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.dishName} numberOfLines={1}>
                {dish.name}
              </Text>
              <Text style={styles.dishQuantity}>{dish.servings} sold</Text>
            </View>
          ))}
        </Card>

        {/* Low stock */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>LOW STOCK REPORT</SectionTitle>
            <Text style={styles.lowCount}>
              {lowStockIngredients.length + outOfStockIngredients.length} ITEMS
            </Text>
          </View>

          {[...outOfStockIngredients, ...lowStockIngredients]
            .slice(0, 4)
            .map((item) => (
              <View key={item.id} style={styles.lowRow}>
                <Icon name="alert" size={14} color={colors.danger} />
                <Text style={styles.lowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.lowQuantity}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            ))}
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

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodTotal: { ...type.labelSm, color: colors.primary },

  chart: { height: 92, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: {
    width: 18,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.primarySoft,
  },
  barCurrent: { backgroundColor: colors.primary },
  day: { fontSize: 9, lineHeight: 11, color: colors.textMuted },
  dayCurrent: { color: colors.primary, fontWeight: '700' },

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