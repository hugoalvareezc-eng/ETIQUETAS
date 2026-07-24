export interface HeightedItem {
  key: string;
  height: number;
}

// Un arreglo por columna, cada uno con las llaves de bloque que le tocaron.
export type ColumnSplit = string[][];

/**
 * Reparte bloques (cada uno con su alto ya medido) entre "columnCount"
 * columnas intentando que todas queden lo más parejas posible en altura
 * total, para no dejar espacios en blanco de un lado. Usa la heurística LPT
 * (ordena de más alto a más chico y va asignando cada bloque a la columna
 * que en ese momento tenga menos altura acumulada); dentro de cada columna
 * los bloques se muestran en su orden original para que la lectura siga
 * siendo lógica.
 */
export function balanceColumns(items: HeightedItem[], columnCount: number): ColumnSplit {
  const n = Math.max(1, columnCount);
  const sums = new Array(n).fill(0);
  const assignment = new Map<string, number>();

  const order = [...items].sort((a, b) => b.height - a.height);
  for (const item of order) {
    let target = 0;
    for (let i = 1; i < n; i++) {
      if (sums[i] < sums[target]) target = i;
    }
    assignment.set(item.key, target);
    sums[target] += item.height;
  }

  const columns: string[][] = Array.from({ length: n }, () => []);
  for (const item of items) {
    columns[assignment.get(item.key)!].push(item.key);
  }
  return columns;
}
