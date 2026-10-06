import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBar, AppBarIcon, Avatar } from '../../components/AppBar';
import { Donut } from '../../components/Donut';
import { Icon, type IconName } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Card, Chip, Divider, Fab, SectionTitle } from '../../components/ui';
import { seedSalesByMethod } from '../../data/seed';
import { useAppState } from '../../store/AppState';
import { colors, radius, spacing, text as type } from '../../theme';
import { peso, percent } from '../../utils/format';

type Stat = {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const {
    todaySales,
    todayOrderCount,
    todayDishesSold,
    pendingTotal,
    ingredients,
    lowStockIngredients,
    availableDishCount,
    totalDishCount,
    topSelling,
    imageFor,
  } = useAppState();

  const availability = percent(availableDishCount, totalDishCount);

  const stats: Stat[] = [
    {
      icon: 'peso',
      iconBg: colors.successSoft,
      iconColor: colors.success,
      value: peso(todaySales),
      label: 'Total Sales',
    },
    {
      icon: 'receipt',
      iconBg: colors.infoSoft,
      iconColor: colors.info,
      value: String(todayOrderCount),
      label: 'Orders',
    },
    {
      icon: 'utensils',
      iconBg: colors.primarySoft,
      iconColor: colors.primary,
      value: String(todayDishesSold),
      label: 'Dishes Sold',
    },
    {
      icon: 'clock',
      iconBg: colors.warningSoft,
      iconColor: colors.warning,
      value: peso(pendingTotal),
      label: 'Pending Payments',
    },
  ];

  return (
    <Screen>
      <AppBar
        title="Dashboard"
        subtitle="Karinderya ni Esgana"
        actions={
          <>
            <AppBarIcon name="bell" accessibilityLabel="Notifications" />
            <Avatar initials="AE" />
          </>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Today&apos;s Sales</Text>

        {/* Stat cards — 2 x 2 grid */}
        <View style={styles.statGrid}>
          {[0, 1].map((row) => (
            <View key={row} style={styles.statRow}>
              {stats.slice(row * 2, row * 2 + 2).map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))}
            </View>
          ))}
        </View>

        {/* Inventory summary */}
        <Card style={styles.block}>
          <SectionTitle>INVENTORY SUMMARY</SectionTitle>

          <View style={styles.summaryRow}>
            <View style={styles.summaryMetrics}>
              <SummaryRow
                label="Low Stock Ingredients"
                value={String(lowStockIngredients.length)}
                tone={colors.danger}
              />
              <SummaryRow label="Total Ingredients" value={String(ingredients.length)} />
              <SummaryRow label="Total Dishes on Menu" value={String(totalDishCount)} />
              <SummaryRow
                label="Out of Stock Dishes"
                value={String(totalDishCount - availableDishCount)}
                tone={colors.danger}
                withInfo
              />
            </View>

            <View style={styles.donutWrap}>
              <Donut value={availability} />
              <View style={styles.donutLabel} pointerEvents="none">
                <Text style={styles.donutPercent}>{availability}%</Text>
                <Text style={styles.donutCaption}>Available Dishes</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Top selling dishes */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>TOP SELLING DISHES</SectionTitle>
            <Chip label="Today" selected={false} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {topSelling.map((dish) => (
              <View key={dish.dishId} style={styles.foodCard}>
                <Image
                  source={imageFor(dish.dishId)}
                  style={styles.foodPhoto}
                  resizeMode="cover"
                />
                <Text style={styles.foodName} numberOfLines={1}>
                  {dish.name}
                </Text>
                <Text style={styles.foodServings}>{dish.servings} servings</Text>
              </View>
            ))}
          </ScrollView>
        </Card>

        {/* Sales by payment method */}
        <Card style={styles.block}>
          <View style={styles.sectionHead}>
            <SectionTitle>SALES BY PAYMENT METHOD</SectionTitle>
            <Chip label="This Week" />
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.colLabel, styles.colMethod]}>Method</Text>
            <Text style={[styles.colLabel, styles.colOrders]}>Orders</Text>
            <Text style={[styles.colLabel, styles.colAmount]}>Amount</Text>
          </View>
          <Divider />

          {seedSalesByMethod.map((bucket) => (
            <View key={bucket.method} style={styles.tableRow}>
              <Text style={[styles.cellMethod, styles.colMethod]}>{bucket.method}</Text>
              <Text style={[styles.cellMuted, styles.colOrders]}>
                {String(bucket.orders)}
              </Text>
              <Text style={[styles.cellStrong, styles.colAmount]}>
                {peso(bucket.amount)}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <Fab
          label="New Order"
          onPress={() => router.push('/pos')}
          style={styles.fab}
        />
      </View>
    </Screen>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  // Figma auto-shrank long currency strings; mirror that so values stay on one line.
  const valueSize = stat.value.length > 5 ? 14 : 18;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: stat.iconBg }]}>
        <Icon name={stat.icon} size={18} color={stat.iconColor} />
      </View>

      <View style={styles.statContent}>
        <Text style={[styles.statValue, { fontSize: valueSize, lineHeight: valueSize + 2 }]}>
          {stat.value}
        </Text>
        <Text style={styles.statLabel} numberOfLines={1}>
          {stat.label}
        </Text>
      </View>

      <Icon name="chevron-right" size={14} color={colors.textFaint} />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  tone,
  withInfo = false,
}: {
  label: string;
  value: string;
  tone?: string;
  withInfo?: boolean;
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
      {withInfo ? (
        <Icon name="info" size={11} color={colors.danger} />
      ) : null}
      <Text style={[styles.summaryValue, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
  pageTitle: { ...type.titleMd, color: colors.text },

  statGrid: { gap: spacing.md },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: { flex: 1 },
  statValue: { ...type.titleSm, color: colors.text },
  statLabel: { ...type.caption, color: colors.textMuted, marginTop: 1 },

  block: { padding: spacing.lg },

  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  summaryMetrics: { flex: 1, gap: 5 },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryLabel: { ...type.caption, color: colors.textMuted, flexShrink: 1 },
  summaryValue: { ...type.labelMd, color: colors.text, marginLeft: 'auto' },

  donutWrap: { width: 80, alignItems: 'center', justifyContent: 'center' },
  donutLabel: { position: 'absolute', alignItems: 'center' },
  donutPercent: { ...type.titleMd, color: colors.text, fontSize: 16, lineHeight: 19 },
  donutCaption: { fontSize: 7, lineHeight: 9, color: colors.textMuted },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },

  carousel: { gap: spacing.md, paddingRight: spacing.xl },
  foodCard: { width: 116, gap: 5 },
  foodPhoto: { width: 116, height: 32, borderRadius: radius.sm, backgroundColor: colors.track },
  foodName: { ...type.labelMd, color: colors.text },
  foodServings: { fontSize: 9, lineHeight: 11, color: colors.textMuted },

  tableHead: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  colLabel: { ...type.caption, color: colors.textMuted, fontWeight: '700' },
  colMethod: { flex: 1, textAlign: 'left' },
  colOrders: { width: 48, textAlign: 'right' },
  colAmount: { width: 78, textAlign: 'right' },

  tableRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', paddingVertical: spacing.xs },
  cellMethod: { ...type.caption, color: colors.text, flex: 1 },
  cellMuted: { ...type.caption, color: colors.textMuted, width: 48, textAlign: 'right' },
  cellStrong: { ...type.caption, color: colors.text, fontWeight: '500', width: 78, textAlign: 'right' },

  fabWrap: { position: 'absolute', right: spacing.xxxl, bottom: spacing.xl, alignItems: 'flex-end' },
  fab: { marginTop: spacing.md },
});