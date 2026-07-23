import { Category, Product } from '../types';

export function filterProducts(products: Product[], query: string, category: Category | 'all'): Product[] {
  const needle = query.trim().toLowerCase();
  return products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (!needle) return true;
    const haystack = `${p.productNameEs} ${p.productNameEn} ${p.brand} ${p.flavor}`.toLowerCase();
    return haystack.includes(needle);
  });
}
