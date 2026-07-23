export interface PackItem {
  id: string;
  widthCm: number;
  heightCm: number;
}

export interface PackedPosition {
  page: number;
  xCm: number;
  yCm: number;
}

export interface PackResult {
  positions: Map<string, PackedPosition>;
  pageCount: number;
}

/**
 * Acomoda etiquetas de distintos tamaños dentro de hojas de un ancho/alto
 * fijo, para aprovechar el papel. Es un empaquetado "por columnas" (greedy,
 * no es el óptimo matemático) pero funciona bien en la práctica: agrupa
 * etiquetas del mismo ancho una debajo de otra y salta de columna u hoja
 * cuando ya no cabe.
 */
export function packLabels(
  items: PackItem[],
  pageContentWidthCm: number,
  pageContentHeightCm: number,
  gapCm: number,
): PackResult {
  const positions = new Map<string, PackedPosition>();
  let page = 0;
  let colX = 0;
  let colY = 0;
  let colWidth = 0;

  for (const item of items) {
    const itemW = item.widthCm;
    const itemH = item.heightCm;

    // ¿Cabe en la columna actual?
    if (colY > 0 && colY + itemH > pageContentHeightCm) {
      colX += colWidth + gapCm;
      colY = 0;
      colWidth = 0;
    }

    // ¿Cabe la columna dentro del ancho de la hoja?
    if (colX + itemW > pageContentWidthCm) {
      if (colX > 0) {
        page += 1;
        colX = 0;
        colY = 0;
        colWidth = 0;
      }
    }

    positions.set(item.id, { page, xCm: colX, yCm: colY });
    colY += itemH + gapCm;
    colWidth = Math.max(colWidth, itemW);
  }

  const pageCount = items.length === 0 ? 0 : Math.max(...[...positions.values()].map((p) => p.page)) + 1;

  return { positions, pageCount };
}
