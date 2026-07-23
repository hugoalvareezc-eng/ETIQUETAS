import { ActiveIngredient, Category, CategoryInfo, Nutrient, Product } from '../types';
import { newId } from '../utils/id';
import { DEFAULT_SECTIONS } from '../utils/sections';

// Ancho sugerido de etiqueta por categoría (cm). Es un punto de partida:
// el tamaño real depende del bote/bolsa de cada producto y se puede ajustar
// por producto en el formulario. El alto de la etiqueta no se fija: se
// calcula solo según cuánto texto tenga cada etiqueta.
export const DEFAULT_LABEL_WIDTH_CM: Record<Category, number> = {
  proteina: 9,
  preentreno: 6,
  creatina: 6,
  aminoacidos: 7,
  vitaminas: 5,
  generico: 7,
};

export const CATEGORIES: CategoryInfo[] = [
  { id: 'proteina', label: 'Proteína', description: 'Whey, isolate, caseína, vegana, etc.' },
  { id: 'preentreno', label: 'Pre-entreno', description: 'Pre-workout / "prees"' },
  { id: 'creatina', label: 'Creatina', description: 'Monohidratada u otras formas' },
  { id: 'aminoacidos', label: 'Aminoácidos', description: 'BCAA, EAA, glutamina, etc.' },
  { id: 'vitaminas', label: 'Vitaminas / Minerales', description: 'Multivitamínicos, vitamina C, zinc, etc.' },
  { id: 'generico', label: 'Genérico / Otro', description: 'Cualquier otro suplemento' },
];

// Filas obligatorias de la tabla NOM-051 (Información Nutrimental), en el orden oficial.
function coreNutrients(): Nutrient[] {
  return [
    { id: newId('nut'), labelEn: 'Calories', labelEs: 'Contenido energético', unit: 'kcal', amount: '', locked: true },
    { id: newId('nut'), labelEn: 'Protein', labelEs: 'Proteínas', unit: 'g', amount: '', locked: true },
    { id: newId('nut'), labelEn: 'Total Fat', labelEs: 'Grasas (Grasa total)', unit: 'g', amount: '', locked: true },
    { id: newId('nut'), labelEn: 'Saturated Fat', labelEs: 'Grasas saturadas', unit: 'g', amount: '', indent: true, locked: true },
    { id: newId('nut'), labelEn: 'Trans Fat', labelEs: 'Grasas trans', unit: 'g', amount: '', indent: true, locked: true },
    { id: newId('nut'), labelEn: 'Total Carbohydrate', labelEs: 'Hidratos de carbono (carbohidratos) disponibles', unit: 'g', amount: '', locked: true },
    { id: newId('nut'), labelEn: 'Total Sugars', labelEs: 'Azúcares totales', unit: 'g', amount: '', indent: true, locked: true },
    { id: newId('nut'), labelEn: 'Added Sugars', labelEs: 'Azúcares añadidos', unit: 'g', amount: '', indent: true, locked: true },
    { id: newId('nut'), labelEn: 'Dietary Fiber', labelEs: 'Fibra dietética', unit: 'g', amount: '', locked: true },
    { id: newId('nut'), labelEn: 'Sodium', labelEs: 'Sodio', unit: 'mg', amount: '', locked: true },
  ];
}

function extraNutrients(category: Category): Nutrient[] {
  if (category === 'vitaminas') {
    return [
      { id: newId('nut'), labelEn: 'Vitamin C', labelEs: 'Vitamina C', unit: 'mg', amount: '', dailyValuePercent: '' },
      { id: newId('nut'), labelEn: 'Vitamin D', labelEs: 'Vitamina D', unit: 'mcg', amount: '', dailyValuePercent: '' },
      { id: newId('nut'), labelEn: 'Vitamin B6', labelEs: 'Vitamina B6', unit: 'mg', amount: '', dailyValuePercent: '' },
      { id: newId('nut'), labelEn: 'Vitamin B12', labelEs: 'Vitamina B12', unit: 'mcg', amount: '', dailyValuePercent: '' },
      { id: newId('nut'), labelEn: 'Zinc', labelEs: 'Zinc', unit: 'mg', amount: '', dailyValuePercent: '' },
      { id: newId('nut'), labelEn: 'Magnesium', labelEs: 'Magnesio', unit: 'mg', amount: '', dailyValuePercent: '' },
    ];
  }
  return [];
}

function defaultActiveIngredients(category: Category): ActiveIngredient[] {
  switch (category) {
    case 'proteina':
      return [
        { id: newId('ai'), nameEn: 'Whey Protein Concentrate', nameEs: 'Concentrado de proteína de suero de leche', amount: '', unit: 'g' },
        { id: newId('ai'), nameEn: 'Whey Protein Isolate', nameEs: 'Aislado de proteína de suero de leche', amount: '', unit: 'g' },
      ];
    case 'preentreno':
      return [
        { id: newId('ai'), nameEn: 'Caffeine Anhydrous', nameEs: 'Cafeína anhidra', amount: '', unit: 'mg' },
        { id: newId('ai'), nameEn: 'Beta-Alanine', nameEs: 'Beta-alanina', amount: '', unit: 'mg' },
        { id: newId('ai'), nameEn: 'L-Citrulline Malate', nameEs: 'L-Citrulina malato', amount: '', unit: 'mg' },
        { id: newId('ai'), nameEn: 'L-Arginine', nameEs: 'L-Arginina', amount: '', unit: 'mg' },
        { id: newId('ai'), nameEn: 'Creatine Monohydrate', nameEs: 'Creatina monohidratada', amount: '', unit: 'mg' },
      ];
    case 'creatina':
      return [
        { id: newId('ai'), nameEn: 'Creatine Monohydrate', nameEs: 'Creatina monohidratada', amount: '', unit: 'g' },
      ];
    case 'aminoacidos':
      return [
        { id: newId('ai'), nameEn: 'L-Leucine', nameEs: 'L-Leucina', amount: '', unit: 'g' },
        { id: newId('ai'), nameEn: 'L-Isoleucine', nameEs: 'L-Isoleucina', amount: '', unit: 'g' },
        { id: newId('ai'), nameEn: 'L-Valine', nameEs: 'L-Valina', amount: '', unit: 'g' },
        { id: newId('ai'), nameEn: 'L-Glutamine', nameEs: 'L-Glutamina', amount: '', unit: 'g' },
      ];
    case 'vitaminas':
      return [];
    default:
      return [];
  }
}

function defaultDirections(category: Category): string {
  switch (category) {
    case 'proteina':
      return 'Mezclar 1 scoop (30 g) con 250-300 ml de agua o leche. Consumir después del entrenamiento o entre comidas.';
    case 'preentreno':
      return 'Mezclar 1 scoop con 200-250 ml de agua fría. Consumir 20-30 minutos antes de entrenar. No exceder 1 porción al día.';
    case 'creatina':
      return 'Mezclar 1 scoop (5 g) con agua, jugo o su bebida favorita. Consumir una vez al día, en cualquier momento.';
    case 'aminoacidos':
      return 'Mezclar 1 scoop con 300-500 ml de agua. Consumir antes, durante o después del entrenamiento.';
    case 'vitaminas':
      return 'Tomar 1 tableta o cápsula al día con alimentos, o como lo indique su médico.';
    default:
      return '';
  }
}

function defaultWarnings(category: Category): string[] {
  const common = [
    'Este producto no sustituye una alimentación equilibrada.',
    'Consulte a su médico antes de consumir este producto si está embarazada, en periodo de lactancia, es menor de edad o tiene alguna condición médica.',
    'Manténgase fuera del alcance de los niños.',
    'No exceder la dosis diaria recomendada.',
  ];
  switch (category) {
    case 'preentreno':
      return [
        ...common,
        'No recomendado para menores de 18 años.',
        'No consumir en combinación con otras fuentes de cafeína.',
        'No consumir en las 6 horas previas a dormir.',
      ];
    case 'creatina':
      return [...common, 'Consuma abundante agua durante el uso de este producto.'];
    default:
      return common;
  }
}

export function createBlankProduct(category: Category): Product {
  const now = Date.now();
  return {
    id: newId('prod'),
    category,
    brand: '',
    productNameEn: '',
    productNameEs: '',
    flavor: '',
    netContent: '',
    servingSizeText: '',
    servingSizeGrams: '',
    servingsPerContainer: '',
    isLiquid: false,
    labelWidthCm: DEFAULT_LABEL_WIDTH_CM[category],
    twoColumns: false,
    compact: false,
    nutrients: [...coreNutrients(), ...extraNutrients(category)],
    activeIngredients: defaultActiveIngredients(category),
    ingredientsListEn: '',
    ingredientsListEs: '',
    directionsEs: defaultDirections(category),
    warningsEs: defaultWarnings(category),
    allergenEs: '',
    storageEs: 'Almacenar en un lugar fresco y seco, fuera de la luz solar directa. Cerrar bien después de cada uso.',
    responsibleEs: '',
    containsCaffeine: category === 'preentreno',
    caffeineMgPerServing: '',
    containsSweeteners: false,
    sections: { ...DEFAULT_SECTIONS },
    createdAt: now,
    updatedAt: now,
  };
}

export function categoryLabel(id: Category): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Rellena campos que no existían en versiones anteriores de la app para
// productos que ya estaban guardados en el navegador, para que no se rompan
// al agregar opciones nuevas (ancho de etiqueta, columnas, secciones, etc.).
export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    labelWidthCm: product.labelWidthCm ?? DEFAULT_LABEL_WIDTH_CM[product.category],
    twoColumns: product.twoColumns ?? false,
    compact: product.compact ?? false,
  };
}
