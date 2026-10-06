import { refresh as refreshCatalogue } from './catalogueStore';
import {
  type CartItemRow,
  type CheckoutInput,
  type OrderRow,
  addToCart as insertCartLine,
  checkoutFromCart,
  clearCart as clearCartTable,
  dashboardTotals,
  dishesSold,
  getProduct,
  initDatabase,
  listCart,
  listOrdersWithItems,
  payOrder as payOrderRow,
  peekNextOrderNumber,
  pendingTotal,
  removeCartItem as removeCartItemRow,
  salesByMethod,
  setCartQuantity as setCartQuantityRow,
  topSelling,
} from './db';

/**
 * Cart, orders and dashboard aggregates, all read from SQLite.
 *
 * Modelled the same way as `catalogueStore`: a cached snapshot plus a
 * subscriber list, so `useSyncExternalStore` sees a stable identity and every
 * mounted screen updates the instant a write commits.
 */

export type PaymentMethod = 'Cash' | 'GCash' | 'Maya';

export type CartLine = {
  id: number;
  productId: number;
  name: string;
  note: string;
  quantity: number;
  unitPrice: number;
  category: string;
  imageKey: string | null;
  unit: string;
};

export type OrderLine = {
  id: number;
  productId: number | null;
  name: string;
  note: string;
  quantity: number;
  unitPrice: number;
};

export type OrderSummary = {
  id: number;
  number: string;
  status: 'pending' | 'paid';
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  method: PaymentMethod | null;
  amountReceived: number | null;
  change: number | null;
  items: OrderLine[];
};

export type PosSnapshot = {
  ready: boolean;
  cart: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  /** Number the in-progress basket will be issued, e.g. "0067". */
  draftOrderNumber: string;
  orders: OrderSummary[];
  totals: {
    todaySales: number;
    todayOrders: number;
    dishesSold: number;
    pendingTotal: number;
    salesByMethod: { method: string; orders: number; amount: number }[];
    topSelling: { name: string; servings: number }[];
  };
};

function toCartLine(row: CartItemRow): CartLine {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    note: row.note,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    category: row.category,
    imageKey: row.image_key,
    unit: row.unit,
  };
}

function toOrder(row: OrderRow & { items: { id: number; product_id: number | null; name: string; note: string; quantity: number; unit_price: number }[] }): OrderSummary {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    createdAt: row.created_at,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    method: row.payment_method,
    amountReceived: row.amount_received,
    change: row.change_amount,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      note: item.note,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  };
}

function buildSnapshot(): PosSnapshot {
  const cart = listCart().map(toCartLine);
  const orders = listOrdersWithItems().map(toOrder);
  const totals = dashboardTotals();

  return {
    ready: true,
    cart,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    cartSubtotal: cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    draftOrderNumber: String(peekNextOrderNumber()).padStart(4, '0'),
    orders,
    totals: {
      todaySales: totals.total_sales,
      todayOrders: totals.order_count,
      dishesSold: dishesSold(),
      pendingTotal: pendingTotal(),
      salesByMethod: salesByMethod(),
      topSelling: topSelling(),
    },
  };
}

let snapshot: PosSnapshot = {
  ready: false,
  cart: [],
  cartCount: 0,
  cartSubtotal: 0,
  draftOrderNumber: '0067',
  orders: [],
  totals: {
    todaySales: 0,
    todayOrders: 0,
    dishesSold: 0,
    pendingTotal: 0,
    salesByMethod: [],
    topSelling: [],
  },
};

const listeners = new Set<() => void>();
let initialised = false;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): PosSnapshot {
  return snapshot;
}

export function refresh(): void {
  snapshot = buildSnapshot();
  emit();
}

/** Opens the database (schema + seed) and takes the first snapshot. */
export function ensureInitialised(): void {
  if (initialised) return;
  // initDatabase() is idempotent, so sharing it with the catalogue store is safe.
  initDatabase();
  initialised = true;
  refresh();
}

// --- Cart actions ------------------------------------------------------

export function addToCart(productId: number, note = ''): void {
  ensureInitialised();

  // Look the row up by id: listProducts() honours the current search filter and
  // would miss the product otherwise.
  const product = getProduct(productId);
  if (!product) return;

  // The price is snapshotted from the catalogue so a later price change cannot
  // retroactively alter an in-progress basket. The ON CONFLICT upsert inside
  // db.addToCart keeps repeated adds on a single row.
  insertCartLine(product, note);
  refresh();
}

export function setCartQuantity(lineId: number, quantity: number): void {
  setCartQuantityRow(lineId, quantity);
  refresh();
}

export function removeCartItem(lineId: number): void {
  removeCartItemRow(lineId);
  refresh();
}

export function clearCart(): void {
  clearCartTable();
  refresh();
}

// --- Order actions -----------------------------------------------------

export function checkout(input: CheckoutInput): string {
  ensureInitialised();
  const number = checkoutFromCart(input);
  // Stock moved, so the catalogue cache has to be rebuilt too.
  refreshCatalogue();
  refresh();
  return number;
}

export function payOrder(orderId: number, input: CheckoutInput): void {
  payOrderRow(orderId, input);
  refresh();
}
