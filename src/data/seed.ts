import type { CartLine, Dish, DishSale, Ingredient, Order, ReportPoint, SalesBucket } from './types';

/**
 * Seed data mirroring the values shown in the Figma mockups.
 * Everything lives in local state so the app runs with no backend.
 */

export const MERCHANT_NAME = 'Karinderya ni Aling Nena';

export const seedDishes: Dish[] = [
  { id: 'pork-adobo', name: 'Pork Adobo', price: 65, category: 'Ulam', available: true, stockLevel: 0.82 },
  { id: 'sinigang-na-baboy', name: 'Sinigang na Baboy', price: 75, category: 'Soup', available: true, stockLevel: 0.64 },
  { id: 'chicken-inasal', name: 'Chicken Inasal', price: 70, category: 'Ulam', available: true, stockLevel: 0.58 },
  { id: 'pinakbet', name: 'Pinakbet', price: 55, category: 'Ulam', available: true, stockLevel: 0.47 },
  { id: 'beef-tapa', name: 'Beef Tapa', price: 80, category: 'Ulam', available: true, stockLevel: 0.36 },
  { id: 'laing', name: 'Laing', price: 50, category: 'Ulam', available: false, stockLevel: 0 },
  { id: 'steamed-rice', name: 'Steamed Rice', price: 30, category: 'Rice', available: true, stockLevel: 0.93 },
  { id: 'garlic-rice', name: 'Garlic Rice', price: 38, category: 'Rice', available: true, stockLevel: 0.71 },
  { id: 'chicken-soup', name: 'Chicken Soup', price: 45, category: 'Soup', available: true, stockLevel: 0.44 },
  { id: 'milo', name: 'Milo', price: 25, category: 'Drinks', available: true, stockLevel: 0.88 },
  { id: 'coke', name: 'Coke', price: 25, category: 'Drinks', available: true, stockLevel: 0.79 },
  { id: 'lemon-poco', name: 'Lemon Pocomento', price: 25, category: 'Drinks', available: true, stockLevel: 0.66 },
  { id: 'soft-boiled-egg', name: 'Soft-Boiled Egg', price: 12, category: 'Extras', available: true, stockLevel: 0.9 },
  { id: 'banana', name: 'Banana', price: 15, category: 'Extras', available: true, stockLevel: 0.52 },
];

export const dishImages: Record<string, any> = {
  'pork-adobo': require('../../assets/dishes/dish-pork-adobo.png'),
  'sinigang-na-baboy': require('../../assets/dishes/dish-sinigang.png'),
  'chicken-inasal': require('../../assets/dishes/dish-chicken-inasal.png'),
  pinakbet: require('../../assets/dishes/dish-pinakbet.png'),
  'beef-tapa': require('../../assets/dishes/dish-beef-tapa.png'),
  laing: require('../../assets/dishes/dish-laing.png'),
};

export const seedIngredients: Ingredient[] = [
  { id: 'rice', name: 'Rice', quantity: 12, parLevel: 15, unit: 'kg', status: 'healthy', icon: 'wheat' },
  { id: 'pork-belly', name: 'Pork Belly', quantity: 3, parLevel: 10, unit: 'kg', status: 'low', icon: 'beef' },
  { id: 'cooking-oil', name: 'Cooking Oil', quantity: 8, parLevel: 10, unit: 'L', status: 'healthy', icon: 'bottle' },
  { id: 'garlic', name: 'Garlic', quantity: 0.5, parLevel: 2, unit: 'kg', status: 'low', icon: 'sprout' },
  { id: 'onion', name: 'Onion', quantity: 4, parLevel: 6, unit: 'kg', status: 'healthy', icon: 'sprout' },
  { id: 'tomato', name: 'Tomato', quantity: 6, parLevel: 8, unit: 'kg', status: 'healthy', icon: 'sprout' },
  { id: 'chicken-thigh', name: 'Chicken Thigh', quantity: 7, parLevel: 12, unit: 'kg', status: 'healthy', icon: 'beef' },
  { id: 'beef-sinigang', name: 'Beef Brisket', quantity: 2, parLevel: 8, unit: 'kg', status: 'low', icon: 'beef' },
  { id: 'vinegar', name: 'Vinegar', quantity: 1, parLevel: 4, unit: 'L', status: 'low', icon: 'bottle' },
  { id: 'soy-sauce', name: 'Soy Sauce', quantity: 0, parLevel: 3, unit: 'L', status: 'out', icon: 'bottle' },
  { id: 'fish-sauce', name: 'Fish Sauce', quantity: 0, parLevel: 2, unit: 'L', status: 'out', icon: 'bottle' },
  { id: 'eggs', name: 'Eggs', quantity: 6, parLevel: 20, unit: 'pcs', status: 'low', icon: 'egg' },
];

export const seedTopSelling: DishSale[] = [
  { dishId: 'pork-adobo', name: 'Pork Adobo', servings: 38 },
  { dishId: 'sinigang-na-baboy', name: 'Sinigang na Baboy', servings: 27 },
  { dishId: 'chicken-inasal', name: 'Chicken Inasal', servings: 21 },
];

/** Weekly "sales by payment method" table on the Dashboard. */
export const seedSalesByMethod: SalesBucket[] = [
  { method: 'Cash', orders: 28, amount: 3640 },
  { method: 'GCash', orders: 24, amount: 3180 },
  { method: 'Maya', orders: 12, amount: 1630 },
];

export const seedSalesTrend: ReportPoint[] = [
  { label: 'M', amount: 30 },
  { label: 'T', amount: 42 },
  { label: 'W', amount: 37 },
  { label: 'T', amount: 56 },
  { label: 'F', amount: 48 },
  { label: 'S', amount: 66, current: true },
  { label: 'S', amount: 52 },
];

export const bestSellingWeek: DishSale[] = [
  { dishId: 'pork-adobo', name: 'Pork Adobo', servings: 186 },
  { dishId: 'sinigang-na-baboy', name: 'Sinigang na Baboy', servings: 143 },
  { dishId: 'chicken-inasal', name: 'Chicken Inasal', servings: 119 },
];

export const dishCategories = ['All', 'Ulam', 'Rice', 'Soup', 'Drinks', 'Extras'] as const;

export const stockFilters = ['All', 'Low Stock', 'Out of Stock'] as const;

/** Heads up given on the Dashboard when a dish runs out. */
export const OUT_OF_STOCK_NOTE = '2 dishes cannot be ordered right now.';

/**
 * Target figures shown on the Dashboard in the Figma mockup. `buildSeedPaidOrders`
 * constructs a matching order history so those totals are genuinely derived from
 * state rather than hard-coded into the UI.
 */
export const SEED_TODAY = {
  orderCount: 64,
  totalSales: 8450,
  dishesSold: 142,
  pendingTotal: 1320,
} as const;

/**
 * Item mix for the generated history: 141 items worth ₱8,400.00 in total, which
 * leaves ₱50.00 for the closing order so the day's figures hit the design
 * targets of 64 orders / 142 dishes / ₱8,450.00 exactly.
 */
const HISTORY_MIX: { id: string; price: number; count: number }[] = [
  { id: 'steamed-rice', price: 30, count: 20 },
  { id: 'beef-tapa', price: 80, count: 10 },
  { id: 'laing', price: 50, count: 20 },
  { id: 'pinakbet', price: 55, count: 20 },
  { id: 'pork-adobo', price: 65, count: 30 },
  { id: 'chicken-inasal', price: 70, count: 25 },
  { id: 'sinigang-na-baboy', price: 75, count: 16 },
];

/** Items per order: 9×1 + 30×2 + 24×3 = 63 orders holding 141 items. */
const HISTORY_ORDER_SIZES: number[] = [
  ...Array(9).fill(1),
  ...Array(30).fill(2),
  ...Array(24).fill(3),
];

/** The dish used for the closing order, priced at the remaining amount. */
const CLOSING_LINE = { id: 'laing', price: 50 };

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/**
 * Builds `SEED_TODAY.orderCount` paid orders containing `SEED_TODAY.dishesSold`
 * items that add up to `SEED_TODAY.totalSales`, so the Dashboard totals are
 * genuinely derived from state rather than hard-coded.
 */
export function buildSeedPaidOrders(): Order[] {
  // Flatten the mix into a deterministic item list, interleaved so consecutive
  // orders do not all contain the same dish.
  const items: { id: string; price: number }[] = [];
  let remaining = HISTORY_MIX.reduce((sum, entry) => sum + entry.count, 0);
  while (remaining > 0) {
    for (const entry of HISTORY_MIX) {
      if (entry.count > 0) {
        items.push({ id: entry.id, price: entry.price });
        entry.count -= 1;
        remaining -= 1;
      }
    }
  }

  const orders: Order[] = [];
  let itemIndex = 0;

  HISTORY_ORDER_SIZES.forEach((size, orderIndex) => {
    const lines: CartLine[] = items
      .slice(itemIndex, itemIndex + size)
      .map((item) => ({ dishId: item.id, quantity: 1, unitPrice: item.price }));
    itemIndex += size;

    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    orders.push({
      id: `seed-order-${orderIndex}`,
      number: String(HISTORY_ORDER_SIZES.length - orderIndex).padStart(4, '0'),
      status: 'paid',
      createdAt: minutesAgo(30 + orderIndex * 17),
      lines,
      subtotal,
      discount: 0,
      total: subtotal,
      paymentMethod: (['Cash', 'GCash', 'Maya'] as const)[orderIndex % 3],
      amountReceived: subtotal,
      change: 0,
    });
  });

  orders.push({
    id: 'seed-order-closing',
    number: '0000',
    status: 'paid',
    createdAt: minutesAgo(5),
    lines: [{ dishId: CLOSING_LINE.id, quantity: 1, unitPrice: CLOSING_LINE.price }],
    subtotal: CLOSING_LINE.price,
    discount: 0,
    total: CLOSING_LINE.price,
    paymentMethod: 'Cash',
    amountReceived: CLOSING_LINE.price,
    change: 0,
  });

  return orders;
}