import { useCallback, useSyncExternalStore } from 'react';

import {
  ensureInitialised,
  getProducts,
  getQuery,
  setQuery,
  subscribe,
  type ProductInput,
} from '../services/catalogueStore';
import type { ProductRow } from '../services/db';

/**
 * Subscribes a component to the `products` table.
 *
 * `ensureInitialised()` runs during the first render (not in an effect) because
 * opening the database is a synchronous side effect that must happen before the
 * first snapshot is read; it is idempotent, so React's double-render in Strict
 * Mode is harmless.
 */
export function useProducts() {
  const onSubscribe = useCallback((listener: () => void) => {
    ensureInitialised();
    return subscribe(listener);
  }, []);

  const products = useSyncExternalStore(onSubscribe, getProducts, getProducts);
  const query = useSyncExternalStore(onSubscribe, getQuery, getQuery);

  const search = useCallback((next: string) => setQuery(next), []);

  return { products, query, search };
}

export type { ProductRow, ProductInput };
