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
  | 'seals'
  | 'activeIngredients'
  | 'ingredientsList'
  | 'directions'
  | 'warnings'
  | 'allergen'
  | 'storage'
  | 'responsible';

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
  isLiquid: boolean;
  labelWidthCm: number;
  labelHeightCm: number | '';
  twoColumns: boolean;
  compact: boolean;
  nutrients: Nutrient[];
  activeIngredients: ActiveIngredient[];
  ingredientsListEn: string;
  ingredientsListEs: string;
  directionsEs: string;
  warningsEs: string[];
  allergenEs: string;
  storageEs: string;
  responsibleEs: string;
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
