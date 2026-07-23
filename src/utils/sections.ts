import { Product, SectionKey, Sections } from '../types';

export const DEFAULT_SECTIONS: Sections = {
  header: true,
  seals: true,
  activeIngredients: true,
  ingredientsList: true,
  directions: true,
  warnings: true,
  allergen: true,
  storage: true,
  responsible: true,
  importedBy: true,
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  header: 'Encabezado (categoría, nombre, marca, sabor, contenido)',
  seals: 'Sellos de advertencia',
  activeIngredients: 'Ingredientes activos',
  ingredientsList: 'Lista de ingredientes',
  directions: 'Modo de uso',
  warnings: 'Advertencias',
  allergen: 'Alérgenos',
  storage: 'Conservación',
  responsible: 'Responsable / distribuido por',
  importedBy: 'Importado y distribuido por',
};

export const SECTION_ORDER: SectionKey[] = [
  'header',
  'seals',
  'activeIngredients',
  'ingredientsList',
  'directions',
  'warnings',
  'allergen',
  'storage',
  'responsible',
  'importedBy',
];

// Los productos guardados antes de que existieran estas opciones no tienen
// `sections` (o pueden tener solo algunas claves); por eso siempre se
// combina con los valores por defecto en vez de leer `product.sections`
// directamente.
export function getSections(product: Product): Sections {
  return { ...DEFAULT_SECTIONS, ...product.sections };
}
