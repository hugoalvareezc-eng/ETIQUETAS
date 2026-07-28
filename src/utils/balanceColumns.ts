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
// Altura acumulada resultante en cada columna con la misma heurística LPT
// que usa balanceColumns, sin construir el reparto completo — sirve para
// comparar qué tan bien (o mal) va a balancear "columnCount" columnas antes
// de decidir usarlo.
function columnSums(items: HeightedItem[], columnCount: number): number[] {
  const n = Math.max(1, columnCount);
  const sums = new Array(n).fill(0);
  const order = [...items].sort((a, b) => b.height - a.height);
  for (const item of order) {
    let target = 0;
    for (let i = 1; i < n; i++) {
      if (sums[i] < sums[target]) target = i;
    }
    sums[target] += item.height;
  }
  return sums;
}

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

/**
 * Cuando uno o más bloques son tan altos por sí solos que ninguna forma de
 * repartir el resto va a llenar las demás columnas (por ejemplo, la tabla
 * nutrimental sola ya mide más que el promedio por columna, y no se puede
 * partir), usar más columnas de las que el contenido realmente aprovecha
 * dejando espacio en blanco que no tiene arreglo por más que se reordenen
 * los bloques. Devuelve cuántas columnas SÍ vale la pena usar (siempre
 * <= columnCount pedido), buscando la mayor cantidad de columnas cuyo
 * desperdicio total no sea mucho peor que con una menos.
 */
export function suggestColumnCount(items: HeightedItem[], columnCount: number): number {
  if (columnCount <= 1 || items.length === 0) return columnCount;
  const total = items.reduce((sum, it) => sum + it.height, 0);
  if (total <= 0) return columnCount;

  const wasteAt = (k: number) => {
    const sums = columnSums(items, k);
    return k * Math.max(...sums) - total;
  };

  let best = columnCount;
  for (let k = columnCount; k >= 2; k--) {
    const wasteHere = wasteAt(k);
    // Si lo que se desperdicia ya es poco frente al total (columnas bien
    // aprovechadas), no tiene caso seguir bajando columnas nada más para
    // ahorrar unos pixeles: eso solo haría la etiqueta más alta sin
    // necesidad.
    if (wasteHere <= total * 0.1) break;
    const wasteOneFewer = wasteAt(k - 1);
    // Bajar una columna ayuda de verdad solo si reduce el desperdicio total
    // a menos de la mitad; si no, usar menos columnas no resuelve nada
    // (el bloque más alto sigue marcando el mínimo posible) y solo achica
    // la etiqueta sin necesidad.
    if (wasteOneFewer < wasteHere * 0.5) {
      best = k - 1;
    } else {
      break;
    }
  }
  return best;
}
