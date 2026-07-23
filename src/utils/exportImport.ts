import { Category, Nutrient, Product } from '../types';
import { createBlankProduct, normalizeProduct } from '../data/categories';
import { newId } from './id';

export function downloadProductsJson(products: Product[], filename = 'catalogo_suplementos.json'): void {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function withIds<T extends { id?: string }>(items: T[] | undefined, prefix: string): (T & { id: string })[] {
  return (items ?? []).map((it) => ({ ...it, id: it.id || newId(prefix) }));
}

function normalizeKey(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

// Combina los nutrimentos que vengan en el JSON importado con las filas
// obligatorias de la plantilla (por nombre en español o inglés), en vez de
// reemplazar la tabla completa. Así un archivo importado puede traer solo
// "Contenido energético" y "Sodio" y las demás filas de la NOM-051 (grasas,
// carbohidratos, etc.) no desaparecen; y cualquier nutrimento extra que no
// esté en la plantilla (una vitamina, por ejemplo) se agrega al final.
function mergeNutrients(base: Nutrient[], provided: Partial<Nutrient>[] | undefined): Nutrient[] {
  if (!provided || provided.length === 0) return base;
  const remaining = [...provided];
  const merged = base.map((row) => {
    const idx = remaining.findIndex(
      (p) => normalizeKey(p.labelEs) === normalizeKey(row.labelEs) || normalizeKey(p.labelEn) === normalizeKey(row.labelEn),
    );
    if (idx === -1) return row;
    const [match] = remaining.splice(idx, 1);
    return { ...row, ...match, id: row.id };
  });
  const extras = remaining.map((p) => ({
    id: newId('nut'),
    labelEn: p.labelEn ?? '',
    labelEs: p.labelEs ?? p.labelEn ?? '',
    unit: p.unit ?? 'mg',
    amount: p.amount ?? '',
    dailyValuePercent: p.dailyValuePercent ?? '',
  } as Nutrient));
  return [...merged, ...extras];
}

/**
 * Convierte un JSON (exportado por esta app, o armado a mano/por Claude con
 * la info de productos reales) en productos completos. Cualquier campo que
 * falte se rellena con la plantilla de esa categoría, así que un JSON
 * parcial (solo con lo que de verdad importa: nombres, tabla nutrimental,
 * ingredientes, etc.) funciona igual que uno exportado completo desde aquí.
 */
export function parseProductsJson(text: string): Product[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!Array.isArray(raw)) {
    throw new Error('El archivo debe contener una lista (array) de productos, por ejemplo: [ { ... }, { ... } ]');
  }

  const now = Date.now();
  return raw.map((entry) => {
    const e = entry as Partial<Product> & { category?: Category };
    const category: Category = e.category ?? 'generico';
    const base = createBlankProduct(category);
    return normalizeProduct({
      ...base,
      ...e,
      nutrients: mergeNutrients(base.nutrients, e.nutrients),
      activeIngredients: e.activeIngredients ? withIds(e.activeIngredients, 'ai') : base.activeIngredients,
      id: newId('prod'),
      createdAt: now,
      updatedAt: now,
    });
  });
}
