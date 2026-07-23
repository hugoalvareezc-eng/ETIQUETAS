import { Product, SectionKey, Sections } from '../types';

export const DEFAULT_SECTIONS: Sections = {
  seals: true,
  activeIngredients: true,
  ingredientsList: true,
  directions: true,
  warnings: true,
  allergen: true,
  storage: true,
  responsible: true,
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  seals: 'Sellos de advertencia',
  activeIngredients: 'Ingredientes activos',
  ingredientsList: 'Lista de ingredientes',
  directions: 'Modo de uso',
  warnings: 'Advertencias',
  allergen: 'Alérgenos',
  storage: 'Conservación',
  responsible: 'Responsable / distribuido por',
};

export const SECTION_ORDER: SectionKey[] = [
  'seals',
  'activeIngredients',
  'ingredientsList',
  'directions',
  'warnings',
  'allergen',
  'storage',
  'responsible',
];

// Los productos guardados antes de que existieran estas opciones no tienen
// `sections` (o pueden tener solo algunas claves); por eso siempre se
// combina con los valores por defecto en vez de leer `product.sections`
// directamente.
export function getSections(product: Product): Sections {
  return { ...DEFAULT_SECTIONS, ...product.sections };
}
