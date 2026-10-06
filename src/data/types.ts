export type DishCategory = 'Ulam' | 'Rice' | 'Soup' | 'Drinks' | 'Extras';

export type Dish = {
  id: string;
  name: string;
  price: number;
  category: DishCategory;
  /** Whether the kitchen currently has enough of this dish to sell. */
  available: boolean;
  /** 0–1, drives the "sold out" state on the POS grid. */
  stockLevel: number;
  image?: ReturnType<typeof require> | number;
};

export type IngredientStatus = 'healthy' | 'low' | 'out';

export type Ingredient = {
  id: string;
  name: string;
  /** Current amount on hand. */
  quantity: number;
  /** Par level the kitchen aims to keep. */
  parLevel: number;
  unit: string;
  status: IngredientStatus;
  /** Icon key from the shared Icon component. */
  icon: string;
};

export type CartLine = {
  dishId: string;
  /** Optional preparation note, e.g. "1 rice", "Regular". */
  note?: string;
  quantity: number;
  /** Price captured when the line was added. */
  unitPrice: number;
};

export type PaymentMethod = 'Cash' | 'GCash' | 'Maya';

export type OrderStatus = 'pending' | 'paid';

export type Order = {
  id: string;
  /** e.g. "0065" */
  number: string;
  status: OrderStatus;
  createdAt: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  /** Cash only — what the customer handed over. */
  amountReceived?: number;
  change?: number;
};

export type SalesBucket = {
  method: PaymentMethod;
  orders: number;
  amount: number;
};

export type ReportPoint = {
  label: string;
  amount: number;
  /** The highlighted bar in the current range. */
  current?: boolean;
};

export type DishSale = {
  dishId: string;
  name: string;
  servings: number;
};