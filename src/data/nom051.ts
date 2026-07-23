import { Nutrient, Product } from '../types';

/**
 * Umbrales de los sellos de advertencia frontal de la NOM-051-SCFI/SSA1-2010
 * (modificación 2020). Los valores aquí usados son los que se citan de forma
 * consistente en guías públicas sobre la norma (ver README). Esta función da
 * una ESTIMACIÓN para ayudar a decidir qué sellos revisar antes de imprimir;
 * no sustituye la verificación final con un consultor de etiquetado o la
 * autoridad correspondiente (COFEPRIS/PROFECO), especialmente para el
 * cálculo exacto de azúcares libres y sodio, que la norma define con más
 * detalle del que un formulario simple puede capturar con certeza.
 */

export interface SealResult {
  id: string;
  label: string;
  triggered: boolean;
  detail: string;
}

function toNumber(v: number | ''): number {
  return v === '' ? 0 : v;
}

export function per100g(product: Product, nutrient: Nutrient): number {
  const servingG = toNumber(product.servingSizeGrams);
  const amount = toNumber(nutrient.amount);
  if (!servingG) return 0;
  return (amount / servingG) * 100;
}

function findNutrient(product: Product, labelEs: string): Nutrient | undefined {
  return product.nutrients.find((n) => n.labelEs === labelEs);
}

export function computeSeals(product: Product): SealResult[] {
  const calNut = findNutrient(product, 'Contenido energético');
  const satNut = findNutrient(product, 'Grasas saturadas');
  const transNut = findNutrient(product, 'Grasas trans');
  const sugarsNut = findNutrient(product, 'Azúcares totales');
  const addedSugarsNut = findNutrient(product, 'Azúcares añadidos');
  const sodiumNut = findNutrient(product, 'Sodio');

  const cal100 = calNut ? per100g(product, calNut) : 0;
  const sat100 = satNut ? per100g(product, satNut) : 0;
  const trans100 = transNut ? per100g(product, transNut) : 0;
  const sugars100 = addedSugarsNut && toNumber(addedSugarsNut.amount) > 0
    ? per100g(product, addedSugarsNut)
    : sugarsNut
      ? per100g(product, sugarsNut)
      : 0;
  const sodium100 = sodiumNut ? per100g(product, sodiumNut) : 0;

  const isLiquid = product.isLiquid;

  const caloriasTrigger = isLiquid ? cal100 >= 70 : cal100 >= 275;
  const satEnergyPct = cal100 > 0 ? (sat100 * 9) / cal100 : 0;
  const transEnergyPct = cal100 > 0 ? (trans100 * 9) / cal100 : 0;
  const sugarsEnergyPct = cal100 > 0 ? (sugars100 * 4) / cal100 : 0;
  const sodiumTrigger = isLiquid ? sodium100 >= 45 : sodium100 >= 350;

  return [
    {
      id: 'calorias',
      label: 'EXCESO CALORÍAS',
      triggered: caloriasTrigger,
      detail: `${cal100.toFixed(0)} kcal/100${isLiquid ? 'ml' : 'g'} (umbral: ${isLiquid ? '70 kcal/100ml' : '275 kcal/100g'})`,
    },
    {
      id: 'azucares',
      label: 'EXCESO AZÚCARES',
      triggered: sugarsEnergyPct >= 0.1,
      detail: `Azúcares aportan ~${(sugarsEnergyPct * 100).toFixed(1)}% de la energía (umbral: 10%)`,
    },
    {
      id: 'grasasSaturadas',
      label: 'EXCESO GRASAS SATURADAS',
      triggered: satEnergyPct >= 0.1,
      detail: `Grasas saturadas aportan ~${(satEnergyPct * 100).toFixed(1)}% de la energía (umbral: 10%)`,
    },
    {
      id: 'grasasTrans',
      label: 'EXCESO GRASAS TRANS',
      triggered: transEnergyPct >= 0.01 && trans100 > 0,
      detail: `Grasas trans aportan ~${(transEnergyPct * 100).toFixed(1)}% de la energía (umbral: 1%)`,
    },
    {
      id: 'sodio',
      label: 'EXCESO SODIO',
      triggered: sodiumTrigger,
      detail: `${sodium100.toFixed(0)} mg/100${isLiquid ? 'ml' : 'g'} (umbral: ${isLiquid ? '45 mg/100ml' : '350 mg/100g'})`,
    },
  ];
}

export function caffeineLegendTriggered(product: Product): boolean {
  return product.containsCaffeine && toNumber(product.caffeineMgPerServing) > 0;
}

export function sweetenerLegendTriggered(product: Product): boolean {
  return product.containsSweeteners;
}
