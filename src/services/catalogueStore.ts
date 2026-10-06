import {
  type ProductRow,
  adjustStock,
  createProduct,
  deleteProduct,
  initDatabase,
  listProducts,
  updateProduct,
} from './db';
import { buildSku } from './sku';

/**
 * A tiny observable wrapper around the `products` table.
 *
 * SQLite is an external, mutable store, so the React 19-correct way to mirror it
 * is `useSyncExternalStore` rather than copying rows into `useState` from an
 * effect. Keeping the snapshot in a module-level cache also guarantees the
 * snapshot identity is stable, which `useSyncExternalStore` requires.
 */

let products: ProductRow[] = [];
let query = '';
let initialised = false;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Runs the schema + seed exactly once per app launch. */
export function ensureInitialised(): void {
  if (initialised) return;
  initDatabase();
  initialised = true;
  refresh();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProducts(): ProductRow[] {
  return products;
}

export function getQuery(): string {
  return query;
}

/** Re-runs the current query and notifies subscribers. */
export function refresh(): void {
  products = listProducts(query);
  emit();
}

export function setQuery(next: string): void {
  query = next;
  refresh();
}

// --- Mutations. Each one re-queries so every mounted list updates at once. ---

export type ProductInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  parLevel: number;
};

export function addProduct(input: ProductInput): void {
  createProduct({
    sku: buildSku(input.name, products),
    name: input.name,
    category: input.category,
    price: input.price,
    stock: input.stock,
    unit: input.unit,
    parLevel: input.parLevel,
  });
  refresh();
}

export function editProduct(id: number, input: ProductInput): void {
  updateProduct(id, input);
  refresh();
}

export function changeStock(id: number, delta: number): void {
  adjustStock(id, delta);
  refresh();
}

export function removeProduct(id: number): void {
  deleteProduct(id);
  refresh();
}

/** Drops every row. Used only by the "reset demo data" affordance. */
export function resetCatalogue(): void {
  products.forEach((product) => deleteProduct(product.id));
  query = '';
  refresh();
}
