import * as SQLite from 'expo-sqlite';

import { seedDishes, seedIngredients } from '../data/seed';
import {
  DATABASE_NAME,
  QUERIES,
  SCHEMA_SQL,
  SCHEMA_VERSION,
} from './schema';

/**
 * Database service for the POS.
 *
 * Every statement comes from `./schema` so the exact same SQL that runs on the
 * device is also executed by `npm run verify:sql` against Node's `node:sqlite`.
 *
 * The synchronous API (`openDatabaseSync` / `execSync` / `runSync` / `getAllSync`)
 * is used deliberately: it is what the lab brief specifies, and the data sets
 * here are tiny. Because these calls block the JS thread, none of them may be
 * invoked during render — only from effects and event handlers.
 */
export const db = SQLite.openDatabaseSync(DATABASE_NAME);

// --- Row shapes --------------------------------------------------------

export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  par_level: number;
  image_key: string | null;
  created_at: string;
};

export type CartItemRow = {
  id: number;
  product_id: number;
  note: string;
  quantity: number;
  unit_price: number;
  sku: string;
  name: string;
  category: string;
  image_key: string | null;
  unit: string;
};

export type OrderRow = {
  id: number;
  number: string;
  status: 'pending' | 'paid';
  created_at: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'Cash' | 'GCash' | 'Maya' | null;
  amount_received: number | null;
  change_amount: number | null;
};

export type OrderItemRow = {
  id: number;
  order_id: number;
  product_id: number | null;
  name: string;
  note: string;
  quantity: number;
  unit_price: number;
};

// --- Initialisation ----------------------------------------------------

/**
 * Creates the schema and, on a fresh install, seeds the catalogue.
 *
 * Guarded by `PRAGMA user_version`, so the DDL runs once per schema version and
 * the seed only fires when the products table is genuinely empty.
 */
export function initDatabase(): void {
  db.execSync(SCHEMA_SQL);

  const versionRow = db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    seedDatabase();
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }
}

/**
 * Inserts the Figma catalogue. Uses a multi-row INSERT so a fresh install is a
 * single statement rather than one call per row.
 */
export function seedDatabase(): void {
  const { count } = db.getFirstSync<{ count: number }>(QUERIES.countProducts)!;
  if (count > 0) return;

  db.withTransactionSync(() => {
    seedDishes.forEach((dish) => {
      const stock = Math.round(dish.stockLevel * 20);
      db.runSync(QUERIES.insertProduct, dish.id, dish.name, dish.category, dish.price, stock, 'pcs', 20);
    });

    seedIngredients.forEach((ingredient) => {
      db.runSync(
        QUERIES.insertProduct,
        ingredient.id,
        ingredient.name,
        'Ingredients',
        0,
        ingredient.quantity,
        ingredient.unit,
        ingredient.parLevel,
      );
    });

    db.runSync(QUERIES.setMeta, 'next_order_number', '67');
  });
}

// --- Products (Read / Update / Delete) ---------------------------------

export function listProducts(search = ''): ProductRow[] {
  const needle = search.trim();
  if (needle.length === 0) {
    return db.getAllSync<ProductRow>(QUERIES.allProducts);
  }
  // Both placeholders are bound, never interpolated.
  return db.getAllSync<ProductRow>(QUERIES.searchProducts, `%${needle}%`, `%${needle}%`);
}

export function listProductsByCategory(category: string): ProductRow[] {
  return db.getAllSync<ProductRow>(QUERIES.searchProductsByCategory, category);
}

export function getProduct(id: number): ProductRow | null {
  return db.getFirstSync<ProductRow>(QUERIES.productById, id);
}

export type NewProduct = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit?: string;
  parLevel?: number;
};

/** Creates a product and returns the new autoincrement id. */
export function createProduct(input: NewProduct): number {
  const result = db.runSync(
    QUERIES.insertProduct,
    input.sku,
    input.name,
    input.category,
    input.price,
    input.stock,
    input.unit ?? 'pcs',
    input.parLevel ?? input.stock,
  );
  return result.lastInsertRowId;
}

export function updateProduct(id: number, input: Omit<NewProduct, 'sku'>): void {
  db.runSync(
    QUERIES.updateProduct,
    input.name,
    input.category,
    input.price,
    input.stock,
    input.unit ?? 'pcs',
    input.parLevel ?? input.stock,
    id,
  );
}

/** `delta` is negative to consume stock and positive to restock. */
export function adjustStock(id: number, delta: number): void {
  db.runSync(QUERIES.adjustStock, delta, id);
}

export function deleteProduct(id: number): void {
  db.runSync(QUERIES.deleteProduct, id);
}

// --- Cart --------------------------------------------------------------

export function listCart(): CartItemRow[] {
  return db.getAllSync<CartItemRow>(QUERIES.cartItems);
}

export function addToCart(product: ProductRow, note = ''): void {
  db.runSync(QUERIES.upsertCartItem, product.id, note, 1, product.price);
}

export function setCartQuantity(id: number, quantity: number): void {
  if (quantity <= 0) {
    db.runSync(QUERIES.removeCartItem, id);
    return;
  }
  db.runSync(QUERIES.setCartQuantity, quantity, id);
}

export function removeCartItem(id: number): void {
  db.runSync(QUERIES.removeCartItem, id);
}

export function clearCart(): void {
  db.runSync(QUERIES.clearCart);
}

// --- Orders ------------------------------------------------------------

export type CheckoutInput = {
  method: 'Cash' | 'GCash' | 'Maya';
  amountReceived: number;
  discount?: number;
};

/** Turns the current cart into a paid order, inside one transaction. */
export function checkoutFromCart(input: CheckoutInput): string {
  const cart = listCart();
  if (cart.length === 0) throw new Error('Cannot check out an empty cart.');

  const subtotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const discount = input.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, input.amountReceived - total);

  const number = nextOrderNumber();
  const createdAt = new Date().toISOString();

  db.withTransactionSync(() => {
    const inserted = db.runSync(
      QUERIES.insertOrder,
      number,
      'pending',
      createdAt,
      subtotal,
      discount,
      total,
      null,
      null,
      null,
    );
    const orderId = inserted.lastInsertRowId;

    cart.forEach((line) => {
      db.runSync(
        QUERIES.insertOrderItem,
        orderId,
        line.product_id,
        line.name,
        line.note,
        line.quantity,
        line.unit_price,
      );
    });

    db.runSync(QUERIES.payOrder, input.method, input.amountReceived, change, orderId);
    db.runSync(QUERIES.clearCart);
  });

  return number;
}

/** Marks an already-pending order as paid. */
export function payOrder(orderId: number, input: CheckoutInput): void {
  const order = db.getFirstSync<OrderRow>('SELECT * FROM orders WHERE id = ?;', orderId);
  if (!order) throw new Error(`Order ${orderId} not found.`);

  const change = Math.max(0, input.amountReceived - order.total);
  db.runSync(QUERIES.payOrder, input.method, input.amountReceived, change, orderId);
}

export function listOrders(): OrderRow[] {
  return db.getAllSync<OrderRow>(QUERIES.allOrders);
}

export function listOrderItems(orderId: number): OrderItemRow[] {
  return db.getAllSync<OrderItemRow>(QUERIES.orderItems, orderId);
}

function nextOrderNumber(): string {
  const row = db.getFirstSync<{ value: string }>(QUERIES.getMeta, 'next_order_number');
  const current = Number(row?.value ?? 67);
  const padded = String(current).padStart(4, '0');
  db.runSync(QUERIES.setMeta, 'next_order_number', String(current + 1));
  return padded;
}

// --- Reporting ---------------------------------------------------------

export function salesByMethod(): { method: string; orders: number; amount: number }[] {
  return db.getAllSync<{ method: string; orders: number; amount: number }>(QUERIES.salesByMethod);
}

export function topSelling(): { name: string; servings: number }[] {
  return db.getAllSync<{ name: string; servings: number }>(QUERIES.topSelling);
}

export function dashboardTotals(): {
  order_count: number;
  total_sales: number;
  total_discount: number;
} {
  return db.getFirstSync<{
    order_count: number;
    total_sales: number;
    total_discount: number;
  }>(QUERIES.dashboardTotals)!;
}

export function dishesSold(): number {
  return db.getFirstSync<{ dishes_sold: number }>(QUERIES.dashboardDishesSold)!.dishes_sold;
}

export function pendingTotal(): number {
  return db.getFirstSync<{ pending_total: number }>(QUERIES.pendingTotal)!.pending_total;
}

export function lowStock(): ProductRow[] {
  return db.getAllSync<ProductRow>(QUERIES.lowStock);
}
