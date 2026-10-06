/**
 * Executes the real schema and query strings from `src/services/schema.ts`
 * against Node's built-in `node:sqlite`, so the SQL can be verified without an
 * Android emulator or a physical device.
 *
 *   node tools/verify-sql.ts
 *
 * This is a development tool and is not bundled into the app.
 *
 * Note: `node:sqlite` names the insert id `lastInsertRowid`, while
 * `expo-sqlite` names it `lastInsertRowId`. `lastInsertId()` normalises both so
 * the assertions below hold against either driver.
 */
import { DatabaseSync } from 'node:sqlite';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DATABASE_NAME,
  QUERIES,
  SCHEMA_SQL,
  SCHEMA_VERSION,
} from '../src/services/schema.ts';

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

function lastInsertId(result: unknown): number {
  const row = result as { lastInsertRowId?: number; lastInsertRowid?: number };
  return Number(row.lastInsertRowId ?? row.lastInsertRowid);
}

// A throwaway file (not :memory:) so WAL journalling is actually exercised.
const dbPath = join(tmpdir(), `karinderya-verify-${process.pid}.db`);
const db = new DatabaseSync(dbPath);

section(`Schema (${DATABASE_NAME}, v${SCHEMA_VERSION})`);
db.exec(SCHEMA_SQL);

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;`)
  .all()
  .map((row: any) => row.name);

check(
  'all domain tables exist',
  ['products', 'orders', 'order_items', 'cart_items', 'meta'].every((t) => tables.includes(t)),
  tables.join(', '),
);

const indexes = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';`)
  .all()
  .map((row: any) => row.name);

check('indexes created', indexes.length >= 5, `${indexes.length}: ${indexes.join(', ')}`);

const journal = db.prepare('PRAGMA journal_mode;').get() as any;
check(
  'WAL journal mode enabled',
  String(journal.journal_mode).toLowerCase() === 'wal',
  journal.journal_mode,
);

const fk = db.prepare('PRAGMA foreign_keys;').get() as any;
check('foreign keys enforced', Number(fk.foreign_keys) === 1, JSON.stringify(fk));

section('Auto-seeding');
const empty = db.prepare(QUERIES.countProducts).get() as any;
check('starts empty (seed guard would fire)', empty.count === 0, `count=${empty.count}`);

db.exec(`
  INSERT INTO products (sku, name, category, price, stock, unit, par_level)
  VALUES
    ('pork-adobo',   'Pork Adobo',         'Ulam',   65.00, 12, 'pcs', 15),
    ('sinigang',     'Sinigang na Baboy', 'Soup',   75.00,  8, 'pcs', 12),
    ('chicken-inasal','Chicken Inasal',     'Ulam',   70.00,  7, 'pcs', 12),
    ('beef-tapa',    'Beef Tapa',          'Ulam',   80.00,  2, 'pcs',  8),
    ('steamed-rice', 'Steamed Rice',       'Rice',   30.00, 20, 'pcs', 20),
    ('soy-sauce',    'Soy Sauce',          'Extras', 35.00,  0, 'L',    3);
`);

check('seed inserted 6 rows', (db.prepare(QUERIES.countProducts).get() as any).count === 6);

section('Create (INSERT) — parameterized');
const inserted = db
  .prepare(QUERIES.insertProduct)
  .run('chicken-soup', 'Chicken Soup', 'Soup', 45.0, 9, 'pcs', 10);
check('INSERT reports one change', inserted.changes === 1, `changes=${inserted.changes}`);
check('autoincrement id assigned', lastInsertId(inserted) === 7, `id=${lastInsertId(inserted)}`);

let uniqueHeld = false;
try {
  db.prepare(QUERIES.insertProduct).run('chicken-soup', 'Copy Cat', 'Soup', 1.0, 1, 'pcs', 1);
} catch {
  uniqueHeld = true;
}
check('UNIQUE(sku) rejects duplicates', uniqueHeld);

let priceCheckHeld = false;
try {
  db.prepare(QUERIES.insertProduct).run('bad-price', 'Negative', 'Ulam', -5.0, 1, 'pcs', 1);
} catch {
  priceCheckHeld = true;
}
check('CHECK(price >= 0) rejects negative price', priceCheckHeld);

section('Read (SELECT) into a list');
const all = db.prepare(QUERIES.allProducts).all() as any[];
check('allProducts returns every row', all.length === 7, `rows=${all.length}`);
check('allProducts ordered by id DESC', Number(all[0].id) === 7, `first id=${all[0].id}`);

section('Search — parameterized LIKE ?');
// Only these two names/categories contain the substring "in".
const hits = db.prepare(QUERIES.searchProducts).all('%in%', '%in%') as any[];
check('LIKE ? matches across name and category', hits.length === 2,
  hits.map((h) => h.name).join(', '));
check('search ordered by name ASC',
  hits.map((h) => h.name).join(' | ') === 'Chicken Inasal | Sinigang na Baboy',
  hits.map((h) => h.name).join(' / '));

const noHits = db.prepare(QUERIES.searchProducts).all('%zzz%', '%zzz%') as any[];
check('non-matching search returns nothing', noHits.length === 0, `rows=${noHits.length}`);

const injection = db
  .prepare(QUERIES.searchProducts)
  .all("'; DROP TABLE products; --", '%zzz%') as any[];
check('SQL-injection attempt returns no rows', injection.length === 0);
check('products table survived injection attempt',
  (db.prepare(QUERIES.countProducts).get() as any).count === 7);

const byCategory = db.prepare(QUERIES.searchProductsByCategory).all('Ulam') as any[];
check('category filter works', byCategory.length === 3, `rows=${byCategory.length}`);

section('Update (stock +/-)');
const stockBefore = (db.prepare(QUERIES.productById).get(4) as any).stock;
db.prepare(QUERIES.adjustStock).run(-1, 4);
check('adjustStock decrements',
  (db.prepare(QUERIES.productById).get(4) as any).stock === stockBefore - 1);

db.prepare(QUERIES.adjustStock).run(-999, 4);
check('adjustStock floors at zero', (db.prepare(QUERIES.productById).get(4) as any).stock === 0);

section('Cart + checkout (relational writes)');
db.prepare(QUERIES.upsertCartItem).run(1, '1 rice', 1, 65.0);
db.prepare(QUERIES.upsertCartItem).run(1, '1 rice', 2, 65.0);
db.prepare(QUERIES.upsertCartItem).run(3, '', 1, 70.0);
const cart = db.prepare(QUERIES.cartItems).all() as any[];
check('ON CONFLICT merges duplicate cart lines', cart.length === 2, `lines=${cart.length}`);
check('merged quantity is 3', cart.find((c) => c.product_id === 1)?.quantity === 3);

db.exec('BEGIN;');
const orderInsert = db
  .prepare(QUERIES.insertOrder)
  .run('0066', 'pending', '2026-10-06 09:00:00', 200, 0, 200, null, null, null);
const orderId = lastInsertId(orderInsert);
db.prepare(QUERIES.insertOrderItem).run(orderId, 1, 'Pork Adobo', '1 rice', 2, 65.0);
db.prepare(QUERIES.insertOrderItem).run(orderId, 3, 'Chicken Inasal', '', 1, 70.0);
db.exec('COMMIT;');

check('order_items rows created', (db.prepare(QUERIES.orderItems).all(orderId) as any[]).length === 2);

db.prepare(QUERIES.payOrder).run('Cash', 250, 50, orderId);
const paid = db.prepare('SELECT * FROM orders WHERE id = ?;').get(orderId) as any;
check('order marked paid with method + change',
  paid.status === 'paid' && paid.change_amount === 50, `${paid.status}/${paid.change_amount}`);

const sales = db.prepare(QUERIES.salesByMethod).all() as any[];
check('salesByMethod aggregates paid orders',
  sales.length === 1 && sales[0].method === 'Cash', JSON.stringify(sales));
const totals = db.prepare(QUERIES.dashboardTotals).get() as any;
check('dashboardTotals counts paid orders',
  totals.order_count === 1 && totals.total_sales === 200, JSON.stringify(totals));
check('dishes sold sums quantities',
  (db.prepare(QUERIES.dashboardDishesSold).get() as any).dishes_sold === 3);
const top = db.prepare(QUERIES.topSelling).all() as any[];
check('topSelling ranks by servings',
  top[0].name === 'Pork Adobo' && top[0].servings === 2, JSON.stringify(top));

section('Delete + referential integrity');
const soldBefore = (db.prepare(QUERIES.dashboardDishesSold).get() as any).dishes_sold;
db.prepare(QUERIES.deleteProduct).run(1);
check('DELETE removed the product', (db.prepare(QUERIES.countProducts).get() as any).count === 6);

const itemsAfter = db.prepare(QUERIES.orderItems).all(orderId) as any[];
check('order_items rows survive product delete (ON DELETE SET NULL)',
  itemsAfter.length === 2, `rows=${itemsAfter.length}`);
check('order_items keep the snapshotted name',
  itemsAfter.some((i) => i.name === 'Pork Adobo'), JSON.stringify(itemsAfter.map((i) => i.name)));
// Only the row that referenced the deleted product detaches; the other row
// still points at a live product and must keep its id.
const adoboRow = itemsAfter.find((i) => i.name === 'Pork Adobo');
const inasalRow = itemsAfter.find((i) => i.name === 'Chicken Inasal');
check('row for the deleted product is detached (product_id -> null)',
  adoboRow?.product_id === null, JSON.stringify(adoboRow));
check('row for a surviving product keeps its product_id',
  inasalRow?.product_id === 3, JSON.stringify(inasalRow));
check('dashboard totals unaffected by product delete',
  (db.prepare(QUERIES.dashboardDishesSold).get() as any).dishes_sold === soldBefore);

db.prepare(QUERIES.deleteProduct).run(99);
check('DELETE of a missing id is a no-op', (db.prepare(QUERIES.countProducts).get() as any).count === 6);

db.prepare(QUERIES.clearCart).run();
check('clearCart empties the cart', (db.prepare(QUERIES.cartItems).all() as any[]).length === 0);

section('Cascade: deleting an order removes its items');
db.prepare(QUERIES.deleteProduct); // no-op reference to keep the query table used
db.prepare('DELETE FROM orders WHERE id = ?;').run(orderId);
check('order_items cascade-deleted with the order',
  (db.prepare(QUERIES.orderItems).all(orderId) as any[]).length === 0);

section('meta key/value');
db.prepare(QUERIES.setMeta).run('next_order_number', '67');
db.prepare(QUERIES.setMeta).run('next_order_number', '68');
check('setMeta upserts by key',
  (db.prepare(QUERIES.getMeta).get('next_order_number') as any).value === '68');

db.close();
for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${dbPath}${suffix}`, { force: true });
}

console.log(`\n${'-'.repeat(52)}`);
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
