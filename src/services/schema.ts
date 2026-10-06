/**
 * The relational schema for the POS database.
 *
 * This module is intentionally free of any `expo-sqlite` import so the exact
 * same DDL and query strings can be executed by the Node test harness
 * (`tools/verify-sql.ts`) against the built-in `node:sqlite` module. That gives
 * us real verification of the SQL without an emulator.
 */

/** Matches the file name required by the lab brief. */
export const DATABASE_NAME = 'pos_inventory.db';

/** Bump when `SCHEMA_SQL` changes so `migrate()` applies the new DDL. */
export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Catalogue -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sku         TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  price       REAL    NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit        TEXT    NOT NULL DEFAULT 'pcs',
  par_level   INTEGER NOT NULL DEFAULT 0 CHECK (par_level >= 0),
  image_key   TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Sales history -------------------------------------------------------
-- order_items snapshots name/unit_price on purpose: deleting a product must
-- never rewrite the totals of a sale that already happened.
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  number          TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  subtotal        REAL NOT NULL CHECK (subtotal >= 0),
  discount        REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total           REAL NOT NULL CHECK (total >= 0),
  payment_method  TEXT CHECK (payment_method IN ('Cash', 'GCash', 'Maya')),
  amount_received REAL,
  change_amount   REAL
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id INTEGER          REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT    NOT NULL,
  note       TEXT    NOT NULL DEFAULT '',
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL    NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- In-progress POS order ----------------------------------------------
-- note is NOT NULL DEFAULT '' so the UNIQUE constraint below actually
-- collapses duplicate rows; SQLite treats NULLs as distinct in UNIQUE.
CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  note       TEXT    NOT NULL DEFAULT '',
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL    NOT NULL CHECK (unit_price >= 0),
  UNIQUE (product_id, note)
);

-- Key/value scratch space (schema version, order counter, ...) ---------
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

/**
 * Every statement the app runs, in one place.
 *
 * All user input is bound with `?` placeholders — never interpolated — which is
 * what keeps the app free of SQL injection (CLO 2.4).
 */
export const QUERIES = {
  // --- Reads -----------------------------------------------------------
  countProducts: 'SELECT COUNT(*) AS count FROM products;',

  /** Step 3 of the lab: dynamic read straight into a <FlatList>. */
  allProducts: `
    SELECT id, sku, name, category, price, stock, unit, par_level, image_key, created_at
      FROM products
     ORDER BY id DESC;`,

  /** Step 4 of the lab: parameterised SQL-level search. */
  searchProducts: `
    SELECT id, sku, name, category, price, stock, unit, par_level, image_key, created_at
      FROM products
     WHERE name LIKE ? OR category LIKE ?
     ORDER BY name ASC;`,

  searchProductsByCategory: `
    SELECT id, sku, name, category, price, stock, unit, par_level, image_key, created_at
      FROM products
     WHERE category = ?
     ORDER BY name ASC;`,

  productById: 'SELECT * FROM products WHERE id = ?;',

  lowStock: `
    SELECT * FROM products
     WHERE stock < par_level
     ORDER BY (stock * 1.0 / NULLIF(par_level, 0)) ASC;`,

  allOrders: `
    SELECT * FROM orders
     ORDER BY datetime(created_at) DESC, id DESC;`,

  orderItems: `
    SELECT oi.*, o.number, o.status, o.created_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC;`,

  cartItems: `
    SELECT ci.id, ci.product_id, ci.note, ci.quantity, ci.unit_price,
           p.sku, p.name, p.category, p.image_key, p.unit
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
     ORDER BY ci.id ASC;`,

  salesByMethod: `
    SELECT payment_method AS method,
           COUNT(*)        AS orders,
           SUM(total)      AS amount
      FROM orders
     WHERE status = 'paid' AND payment_method IS NOT NULL
     GROUP BY payment_method
     ORDER BY amount DESC;`,

  topSelling: `
    SELECT oi.name       AS name,
           SUM(oi.quantity) AS servings
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'paid'
     GROUP BY oi.name
     ORDER BY servings DESC
     LIMIT 5;`,

  dashboardTotals: `
    SELECT COUNT(*)                                   AS order_count,
           COALESCE(SUM(total), 0)                    AS total_sales,
           COALESCE(SUM(discount), 0)                 AS total_discount
      FROM orders
     WHERE status = 'paid';`,

  dashboardDishesSold: `
    SELECT COALESCE(SUM(oi.quantity), 0) AS dishes_sold
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'paid';`,

  pendingTotal: `
    SELECT COALESCE(SUM(total), 0) AS pending_total
      FROM orders
     WHERE status = 'pending';`,

  // --- Writes (all parameterised) -------------------------------------
  insertProduct: `
    INSERT INTO products (sku, name, category, price, stock, unit, par_level)
    VALUES (?, ?, ?, ?, ?, ?, ?);`,

  updateProduct: `
    UPDATE products
       SET name = ?, category = ?, price = ?, stock = ?, unit = ?, par_level = ?
     WHERE id = ?;`,

  /** Bonus criterion: +/- stock. */
  adjustStock: 'UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?;',

  deleteProduct: 'DELETE FROM products WHERE id = ?;',

  insertOrder: `
    INSERT INTO orders (number, status, created_at, subtotal, discount, total,
                        payment_method, amount_received, change_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,

  insertOrderItem: `
    INSERT INTO order_items (order_id, product_id, name, note, quantity, unit_price)
    VALUES (?, ?, ?, ?, ?, ?);`,

  payOrder: `
    UPDATE orders
       SET status = 'paid', payment_method = ?, amount_received = ?, change_amount = ?
     WHERE id = ? AND status = 'pending';`,

  upsertCartItem: `
    INSERT INTO cart_items (product_id, note, quantity, unit_price)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (product_id, note)
    DO UPDATE SET quantity = quantity + excluded.quantity;`,

  setCartQuantity: 'UPDATE cart_items SET quantity = ? WHERE id = ?;',

  removeCartItem: 'DELETE FROM cart_items WHERE id = ?;',

  clearCart: 'DELETE FROM cart_items;',

  setMeta: `
    INSERT INTO meta (key, value) VALUES (?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value;`,

  getMeta: 'SELECT value FROM meta WHERE key = ?;',
} as const;
