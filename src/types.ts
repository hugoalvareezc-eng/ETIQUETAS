export type Category =
  | 'proteina'
  | 'preentreno'
  | 'creatina'
  | 'aminoacidos'
  | 'vitaminas'
  | 'generico';

export interface CategoryInfo {
  id: Category;
  label: string;
  description: string;
}

export type NutrientUnit = 'g' | 'mg' | 'mcg' | 'kcal' | 'kJ';

export interface Nutrient {
  id: string;
  labelEn: string;
  labelEs: string;
  unit: NutrientUnit;
  amount: number | '';
  dailyValuePercent?: number | '';
  indent?: boolean;
  locked?: boolean;
}

export interface ActiveIngredient {
  id: string;
  nameEn: string;
  nameEs: string;
  amount: number | '';
  unit: string;
}

export type SectionKey =
  | 'header'
  | 'seals'
  | 'activeIngredients'
  | 'ingredientsList'
  | 'directions'
  | 'warnings'
  | 'allergen'
  | 'storage'
  | 'disclaimer'
  | 'responsible'
  | 'importedBy';

export type Sections = Record<SectionKey, boolean>;

export interface Product {
  id: string;
  category: Category;
  brand: string;
  productNameEn: string;
  productNameEs: string;
  flavor: string;
  netContent: string;
  servingSizeText: string;
  servingSizeGrams: number | '';
  servingsPerContainer: number | '';
  // Segunda porción de referencia opcional (ej. la etiqueta original trae
  // "1 scoop" y "2 scoops" y no quieres perder ninguna de las dos): agrega
  // una columna extra a la tabla nutrimental con cada valor multiplicado
  // por este factor respecto a la porción principal. Vacío = no se muestra.
  secondServingSizeText: string;
  secondServingScale: number | '';
  isLiquid: boolean;
  labelWidthCm: number;
  labelHeightCm: number | '';
  // Cuántas columnas usar para acomodar el contenido de la etiqueta (1 =
  // normal). Útil para etiquetas anchas y bajas ("chaparras"), donde 2 o 3
  // columnas dejan la etiqueta bastante menos alta.
  columnCount: 1 | 2 | 3;
  compact: boolean;
  nutrients: Nutrient[];
  activeIngredients: ActiveIngredient[];
  ingredientsListEn: string;
  ingredientsListEs: string;
  directionsEs: string;
  warningsEs: string[];
  allergenEs: string;
  storageEs: string;
  // Aviso corto que se imprime en negritas (ej. "Este producto no es un
  // medicamento..."), sin encabezado propio, separado de "Advertencias".
  disclaimerEs: string;
  responsibleEs: string;
  importedByEs: string;
  containsCaffeine: boolean;
  caffeineMgPerServing: number | '';
  containsSweeteners: boolean;
  sections?: Partial<Sections>;
  createdAt: number;
  updatedAt: number;
}

export interface DictionaryEntry {
  en: string;
  es: string;
  group: string;
}
