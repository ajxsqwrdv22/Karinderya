/**
 * Pure helpers for turning a product name into a unique SKU.
 *
 * Kept free of any `expo-sqlite` import so it can be unit tested by the Node
 * harness in `tools/`.
 */

/** "Beef Tapa" -> "beef-tapa"; falls back to "item" when nothing survives. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}

/**
 * Builds an unused SKU from the product name.
 *
 * `existing` only needs a `sku` field, so callers can pass whatever rows they
 * already hold. Collisions get a numeric suffix: `beef-tapa`, `beef-tapa-2`, ...
 */
export function buildSku(name: string, existing: { sku: string }[]): string {
  const base = slugify(name);

  const taken = new Set(existing.map((product) => product.sku));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;

  return `${base}-${suffix}`;
}
