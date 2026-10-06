import { useCallback, useSyncExternalStore } from 'react';

import {
  ensureInitialised,
  getSnapshot,
  subscribe,
} from '../services/posStore';
import type { PosSnapshot } from '../services/posStore';

/**
 * Subscribes a component to the cart / orders / aggregates snapshot.
 *
 * As with `useProducts`, the database is opened lazily on first subscribe so
 * the very first snapshot already contains seeded rows. It is idempotent, so
 * React's double-render in Strict Mode is harmless.
 */
export function usePosStore(): PosSnapshot {
  const onSubscribe = useCallback((listener: () => void) => {
    ensureInitialised();
    return subscribe(listener);
  }, []);

  return useSyncExternalStore(onSubscribe, getSnapshot, getSnapshot);
}

export { refresh } from '../services/posStore';

// Screens import the mutation helpers straight from the store module, which
// keeps this hook file focused on subscribing to the snapshot.
export {
  addToCart,
  checkout,
  clearCart,
  payOrder,
  removeCartItem,
  setCartQuantity,
} from '../services/posStore';

export type {
  CartLine,
  OrderLine,
  OrderSummary,
  PaymentMethod,
  PosSnapshot,
} from '../services/posStore';
