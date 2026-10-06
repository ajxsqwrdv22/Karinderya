import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { dishImages } from '../data/images';
import {
  buildSeedPaidOrders,
  seedDishes,
  seedIngredients,
  seedTopSelling,
} from '../data/seed';
import type {
  CartLine,
  Dish,
  Ingredient,
  Order,
  PaymentMethod,
} from '../data/types';

const STORAGE_KEY = 'karinderya.state.v1';

/**
 * The number the next checkout will be issued. The seeded held order below uses
 * 0065, so the in-progress POS order is numbered 0066 and the two never collide.
 */
const START_ORDER_NUMBER = 66;

type Receipt = {
  orderNumber: string;
  method: PaymentMethod;
  total: number;
  amountReceived: number;
  change: number;
  paidAt: string;
};

type State = {
  dishes: Dish[];
  ingredients: Ingredient[];
  cart: CartLine[];
  /** Discount in pesos, applied at the order sheet. */
  discount: number;
  orders: Order[];
  nextOrderNumber: number;
  lastReceipt: Receipt | null;
};

type Action =
  | { type: 'hydrate'; payload: Partial<State> }
  | { type: 'cart/add'; dish: Dish }
  | { type: 'cart/decrement'; dishId: string; note?: string }
  | { type: 'cart/remove'; dishId: string; note?: string }
  | { type: 'cart/setQuantity'; dishId: string; note?: string; quantity: number }
  | { type: 'cart/setDiscount'; value: number }
  | { type: 'cart/clear' }
  | { type: 'order/checkout'; payload: { method: PaymentMethod; amountReceived: number } }
  | {
      type: 'order/pay-pending';
      payload: { orderId: string; method: PaymentMethod; amountReceived: number };
    }
  | { type: 'stock/restock'; ingredientId: string }
  | { type: 'receipt/clear' };

function cartKey(dishId: string, note?: string): string {
  return `${dishId}::${note ?? ''}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate': {
      const merged = { ...state, ...action.payload };

      return {
        ...merged,
        // `image` is a `require()` result, so it serialises to something
        // unusable. Always re-attach the real asset for each dish.
        dishes: merged.dishes.map((dish) => ({
          ...dish,
          image: dishImages[dish.id],
        })),
      };
    }

    case 'cart/add': {
      const note = action.dish.id === 'pork-adobo' ? '1 rice' : undefined;
      const key = cartKey(action.dish.id, note);
      const existing = state.cart.find(
        (line) => cartKey(line.dishId, line.note) === key,
      );

      if (existing) {
        return {
          ...state,
          cart: state.cart.map((line) =>
            cartKey(line.dishId, line.note) === key
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          ),
        };
      }

      return {
        ...state,
        cart: [
          ...state.cart,
          { dishId: action.dish.id, note, quantity: 1, unitPrice: action.dish.price },
        ],
      };
    }

    case 'cart/decrement': {
      const key = cartKey(action.dishId, action.note);
      const line = state.cart.find(
        (item) => cartKey(item.dishId, item.note) === key,
      );
      if (!line) return state;

      if (line.quantity <= 1) {
        return {
          ...state,
          cart: state.cart.filter(
            (item) => cartKey(item.dishId, item.note) !== key,
          ),
        };
      }

      return {
        ...state,
        cart: state.cart.map((item) =>
          cartKey(item.dishId, item.note) === key
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      };
    }

    case 'cart/remove':
      return {
        ...state,
        cart: state.cart.filter(
          (item) => cartKey(item.dishId, item.note) !== cartKey(action.dishId, action.note),
        ),
      };

    case 'cart/setQuantity':
      return {
        ...state,
        cart: state.cart.map((item) =>
          cartKey(item.dishId, item.note) === cartKey(action.dishId, action.note)
            ? { ...item, quantity: Math.max(0, action.quantity) }
            : item,
        ).filter((item) => item.quantity > 0),
      };

    case 'cart/setDiscount':
      return { ...state, discount: Math.max(0, action.value) };

    case 'cart/clear':
      return { ...state, cart: [], discount: 0 };

    case 'order/checkout': {
      if (state.cart.length === 0) return state;

      const subtotal = state.cart.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0,
      );
      const total = Math.max(0, subtotal - state.discount);
      const number = String(state.nextOrderNumber).padStart(4, '0');
      const createdAt = new Date().toISOString();

      const order: Order = {
        id: `order-${number}-${Date.now()}`,
        number,
        status: 'paid',
        createdAt,
        lines: state.cart,
        subtotal,
        discount: state.discount,
        total,
        paymentMethod: action.payload.method,
        amountReceived: action.payload.amountReceived,
        change: Math.max(0, action.payload.amountReceived - total),
      };

      // Selling a dish draws down its stock level; below 10% it sells out.
      const dishes = state.dishes.map((dish) => {
        const sold = state.cart
          .filter((line) => line.dishId === dish.id)
          .reduce((sum, line) => sum + line.quantity, 0);
        if (sold === 0) return dish;
        const level = Math.max(0, dish.stockLevel - sold * 0.04);
        return { ...dish, stockLevel: level, available: level > 0.1 };
      });

      return {
        ...state,
        dishes,
        cart: [],
        discount: 0,
        orders: [order, ...state.orders],
        nextOrderNumber: state.nextOrderNumber + 1,
        lastReceipt: {
          orderNumber: number,
          method: action.payload.method,
          total,
          amountReceived: action.payload.amountReceived,
          change: Math.max(0, action.payload.amountReceived - total),
          paidAt: createdAt,
        },
      };
    }

    case 'order/pay-pending': {
      const target = state.orders.find((order) => order.id === action.payload.orderId);
      if (!target || target.status === 'paid') return state;

      const change = Math.max(0, action.payload.amountReceived - target.total);
      const paidAt = new Date().toISOString();

      // Selling the pending order draws its dishes down, same as a checkout.
      const dishes = state.dishes.map((dish) => {
        const sold = target.lines
          .filter((line) => line.dishId === dish.id)
          .reduce((sum, line) => sum + line.quantity, 0);
        if (sold === 0) return dish;
        const level = Math.max(0, dish.stockLevel - sold * 0.04);
        return { ...dish, stockLevel: level, available: level > 0.1 };
      });

      return {
        ...state,
        dishes,
        orders: state.orders.map((order) =>
          order.id === target.id
            ? {
                ...order,
                status: 'paid' as const,
                paymentMethod: action.payload.method,
                amountReceived: action.payload.amountReceived,
                change,
              }
            : order,
        ),
        lastReceipt: {
          orderNumber: target.number,
          method: action.payload.method,
          total: target.total,
          amountReceived: action.payload.amountReceived,
          change,
          paidAt,
        },
      };
    }

    case 'stock/restock': {
      return {
        ...state,
        ingredients: state.ingredients.map((ingredient) =>
          ingredient.id === action.ingredientId
            ? {
                ...ingredient,
                quantity: ingredient.parLevel,
                status: 'healthy' as const,
              }
            : ingredient,
        ),
      };
    }

    case 'receipt/clear':
      return { ...state, lastReceipt: null };

    default:
      return state;
  }
}

/** The pending order from the Figma mockup, so Payment is never empty on first run. */
function seedPendingOrder(): Order {
  return {
    id: 'order-seed-0065',
    number: '0065',
    status: 'pending',
    createdAt: new Date().toISOString(),
    lines: [
      { dishId: 'pork-adobo', note: '1 rice', quantity: 1, unitPrice: 65 },
      { dishId: 'chicken-inasal', note: 'Regular', quantity: 1, unitPrice: 70 },
      { dishId: 'steamed-rice', note: 'Extra', quantity: 1, unitPrice: 30 },
    ],
    subtotal: 165,
    discount: 0,
    total: 165,
  };
}

function initialState(): State {
  const dishes = seedDishes.map((dish) => ({
    ...dish,
    image: dishImages[dish.id],
  }));

  // Newest first: the live order on top, then the generated history.
  const orders = [seedPendingOrder(), ...buildSeedPaidOrders()];

  return {
    dishes,
    ingredients: seedIngredients,
    cart: [],
    discount: 0,
    orders,
    nextOrderNumber: START_ORDER_NUMBER + 1,
    lastReceipt: null,
  };
}

type AppStateValue = State & {
  ready: boolean;
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;
  dishById: (id: string) => Dish | undefined;
  nameFor: (dishId: string) => string;
  imageFor: (dishId: string) => any;
  pendingOrders: Order[];
  paidOrders: Order[];
  topSelling: typeof seedTopSelling;
  lowStockIngredients: Ingredient[];
  outOfStockIngredients: Ingredient[];
  availableDishCount: number;
  totalDishCount: number;
  todaySales: number;
  todayOrderCount: number;
  todayDishesSold: number;
  pendingTotal: number;

  addToCart: (dish: Dish) => void;
  decrementCartLine: (dishId: string, note?: string) => void;
  setCartQuantity: (dishId: string, note: string | undefined, quantity: number) => void;
  removeCartLine: (dishId: string, note?: string) => void;
  setDiscount: (value: number) => void;
  clearCart: () => void;
  checkout: (method: PaymentMethod, amountReceived: number) => void;
  payPendingOrder: (
    orderId: string,
    method: PaymentMethod,
    amountReceived: number,
  ) => void;
  restock: (ingredientId: string) => void;
  clearReceipt: () => void;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [ready, setReady] = React.useState(false);

  // Restore the previous session so a refresh doesn't lose the cart.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const saved = JSON.parse(raw) as Partial<State>;
          dispatch({ type: 'hydrate', payload: saved });
        }
      } catch {
        // A corrupt cache is not worth crashing over — fall back to seed data.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    // Image sources are stripped: they are re-resolved from `dishImages` on
    // hydration, and keeping them out of the cache avoids storing dead URIs.
    const { dishes, ...rest } = state;
    const serialisable = {
      ...rest,
      dishes: dishes.map(({ image, ...dish }) => dish),
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable)).catch(() => {
      // Persistence is a convenience; ignore write failures.
    });
  }, [state, ready]);

  const addToCart = useCallback((dish: Dish) => dispatch({ type: 'cart/add', dish }), []);
  const decrementCartLine = useCallback(
    (dishId: string, note?: string) => dispatch({ type: 'cart/decrement', dishId, note }),
    [],
  );
  const setCartQuantity = useCallback(
    (dishId: string, note: string | undefined, quantity: number) =>
      dispatch({ type: 'cart/setQuantity', dishId, note, quantity }),
    [],
  );
  const removeCartLine = useCallback(
    (dishId: string, note?: string) => dispatch({ type: 'cart/remove', dishId, note }),
    [],
  );
  const setDiscount = useCallback((value: number) => dispatch({ type: 'cart/setDiscount', value }), []);
  const clearCart = useCallback(() => dispatch({ type: 'cart/clear' }), []);
  const checkout = useCallback(
    (method: PaymentMethod, amountReceived: number) =>
      dispatch({ type: 'order/checkout', payload: { method, amountReceived } }),
    [],
  );
  const payPendingOrder = useCallback(
    (orderId: string, method: PaymentMethod, amountReceived: number) =>
      dispatch({ type: 'order/pay-pending', payload: { orderId, method, amountReceived } }),
    [],
  );
  const restock = useCallback((ingredientId: string) => dispatch({ type: 'stock/restock', ingredientId }), []);
  const clearReceipt = useCallback(() => dispatch({ type: 'receipt/clear' }), []);

  const value = useMemo<AppStateValue>(() => {
    const dishById = (id: string) => state.dishes.find((dish) => dish.id === id);

    const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartSubtotal = state.cart.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    const cartTotal = Math.max(0, cartSubtotal - state.discount);

    const pendingOrders = state.orders.filter((order) => order.status === 'pending');
    const paidOrders = state.orders.filter((order) => order.status === 'paid');

    const todaySales = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const todayOrderCount = paidOrders.length;
    const todayDishesSold = paidOrders.reduce(
      (sum, order) => sum + order.lines.reduce((n, line) => n + line.quantity, 0),
      0,
    );
    const pendingTotal = pendingOrders.reduce((sum, order) => sum + order.total, 0);

    const availableDishCount = state.dishes.filter((dish) => dish.available).length;

    return {
      ...state,
      ready,
      cartCount,
      cartSubtotal,
      cartTotal,
      dishById,
      nameFor: (dishId: string) => dishById(dishId)?.name ?? dishId,
      imageFor: (dishId: string) => dishById(dishId)?.image,
      pendingOrders,
      paidOrders,
      topSelling: seedTopSelling,
      lowStockIngredients: state.ingredients.filter((item) => item.status === 'low'),
      outOfStockIngredients: state.ingredients.filter((item) => item.status === 'out'),
      availableDishCount,
      totalDishCount: state.dishes.length,
      todaySales,
      todayOrderCount,
      todayDishesSold,
      pendingTotal,
      addToCart,
      decrementCartLine,
      setCartQuantity,
      removeCartLine,
      setDiscount,
      clearCart,
      checkout,
      payPendingOrder,
      restock,
      clearReceipt,
    };
  }, [
    state,
    ready,
    addToCart,
    decrementCartLine,
    setCartQuantity,
    removeCartLine,
    setDiscount,
    clearCart,
    checkout,
    payPendingOrder,
    restock,
    clearReceipt,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside <AppStateProvider>.');
  }
  return context;
}