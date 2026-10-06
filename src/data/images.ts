/**
 * Bundled dish photography, keyed by the product `sku` stored in SQLite.
 *
 * These are `require()` calls, so this module must stay out of anything that
 * runs outside the React Native bundler (such as the Node SQL test harness).
 * Keep the data itself in `seed.ts`.
 */
export const dishImages: Record<string, any> = {
  'pork-adobo': require('../../assets/dishes/dish-pork-adobo.png'),
  'sinigang-na-baboy': require('../../assets/dishes/dish-sinigang.png'),
  'chicken-inasal': require('../../assets/dishes/dish-chicken-inasal.png'),
  pinakbet: require('../../assets/dishes/dish-pinakbet.png'),
  'beef-tapa': require('../../assets/dishes/dish-beef-tapa.png'),
  laing: require('../../assets/dishes/dish-laing.png'),
};
