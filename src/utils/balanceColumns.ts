export interface HeightedItem {
  key: string;
  height: number;
}

export interface ColumnSplit {
  left: string[];
  right: string[];
}

/**
 * Reparte bloques (cada uno con su alto ya medido) entre 2 columnas
 * intentando que ambas queden lo más parejas posible en altura total, para
 * no dejar espacios en blanco de un lado. Usa la heurística LPT (ordena de
 * más alto a más chico y va asignando cada bloque a la columna que en ese
 * momento tenga menos altura acumulada); dentro de cada columna los bloques
 * se muestran en su orden original para que la lectura siga siendo lógica.
 */
export function balanceColumns(items: HeightedItem[]): ColumnSplit {
  const order = items
    .map((_, i) => i)
    .sort((a, b) => items[b].height - items[a].height);

  const leftSet = new Set<number>();
  const rightSet = new Set<number>();
  let leftSum = 0;
  let rightSum = 0;

  for (const i of order) {
    if (leftSum <= rightSum) {
      leftSet.add(i);
      leftSum += items[i].height;
    } else {
      rightSet.add(i);
      rightSum += items[i].height;
    }
  }

  const left = items.filter((_, i) => leftSet.has(i)).map((it) => it.key);
  const right = items.filter((_, i) => rightSet.has(i)).map((it) => it.key);
  return { left, right };
}
