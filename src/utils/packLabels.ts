export interface PackItem {
  id: string;
  widthCm: number;
  heightCm: number;
}

export interface PackedPosition {
  page: number;
  xCm: number;
  yCm: number;
  // Si es true, la etiqueta se gira 90° (su hueco en la hoja mide
  // heightCm de ancho por widthCm de alto) porque así aprovecha mejor
  // el espacio disponible.
  rotated: boolean;
}

export interface PackResult {
  positions: Map<string, PackedPosition>;
  pageCount: number;
}

interface Shelf {
  page: number;
  yCm: number;
  heightCm: number;
  usedWidthCm: number;
}

interface Orientation {
  w: number;
  h: number;
  rotated: boolean;
}

const EPS = 1e-6;

/**
 * Acomoda etiquetas de distintos tamaños dentro de hojas de un ancho/alto
 * fijo, buscando desperdiciar el menor papel posible: agrupa las etiquetas
 * en "repisas" (renglones), cada una con la altura de la etiqueta más alta
 * que le toca, y va llenando cada repisa de izquierda a derecha (algoritmo
 * shelf / First-Fit Decreasing). Para cada etiqueta se evalúan las dos
 * orientaciones (normal y girada 90°) y se usa la que mejor aproveche el
 * espacio disponible en ese momento — así una etiqueta angosta y alta se
 * puede acomodar acostada si eso deja lugar para más etiquetas en la misma
 * hoja, en vez de dejar una hoja casi vacía con una sola etiqueta.
 */
export function packLabels(
  items: PackItem[],
  pageContentWidthCm: number,
  pageContentHeightCm: number,
  gapCm: number,
): PackResult {
  const positions = new Map<string, PackedPosition>();
  const shelves: Shelf[] = [];
  const pageNextY: number[] = [0];

  function orientationsFor(item: PackItem): Orientation[] {
    const normal: Orientation = { w: item.widthCm, h: item.heightCm, rotated: false };
    const rotated: Orientation = { w: item.heightCm, h: item.widthCm, rotated: true };
    const candidates = [normal, rotated].filter((o) => o.w <= pageContentWidthCm + EPS);
    return candidates.length > 0 ? candidates : [normal];
  }

  // Se acomodan primero las etiquetas más grandes (por su lado mayor), que
  // es lo que más margen de maniobra necesita; las chicas van rellenando
  // los huecos que van quedando.
  const order = [...items].sort(
    (a, b) => Math.max(b.widthCm, b.heightCm) - Math.max(a.widthCm, a.heightCm),
  );

  for (const item of order) {
    const orientations = orientationsFor(item);

    // 1) ¿Ya cabe en alguna repisa existente (de cualquier hoja)?
    let placedInShelf = false;
    for (const shelf of shelves) {
      const fit = orientations.find(
        (o) =>
          o.h <= shelf.heightCm + EPS &&
          shelf.usedWidthCm + (shelf.usedWidthCm > 0 ? gapCm : 0) + o.w <= pageContentWidthCm + EPS,
      );
      if (fit) {
        const x = shelf.usedWidthCm > 0 ? shelf.usedWidthCm + gapCm : 0;
        positions.set(item.id, { page: shelf.page, xCm: x, yCm: shelf.yCm, rotated: fit.rotated });
        shelf.usedWidthCm = x + fit.w;
        placedInShelf = true;
        break;
      }
    }
    if (placedInShelf) continue;

    // 2) No cupo en ninguna repisa: se abre una nueva, en la hoja actual si
    // alcanza el alto, o en una hoja nueva si no.
    let page = pageNextY.length - 1;
    let y = pageNextY[page];
    let remaining = pageContentHeightCm - y;
    let fitting = orientations.filter((o) => o.h <= remaining + EPS);
    if (fitting.length === 0) {
      // Solo tiene caso abrir una hoja nueva si en una hoja vacía sí
      // cabría (si de plano no cabe en ninguna orientación ni con toda la
      // hoja disponible, abrir otra hoja en blanco no ayuda en nada).
      const fitsFreshPage = orientations.some((o) => o.h <= pageContentHeightCm + EPS);
      if (fitsFreshPage) {
        page += 1;
        pageNextY.push(0);
        y = 0;
        remaining = pageContentHeightCm;
        fitting = orientations.filter((o) => o.h <= remaining + EPS);
      }
    }
    // Entre las orientaciones que sí caben, se prefiere la de menor alto:
    // deja la repisa más baja y por lo tanto más espacio libre para otras
    // etiquetas debajo. Si ninguna cabe ni en una hoja vacía (etiqueta más
    // alta que la hoja en ambas orientaciones), se usa la normal y se deja
    // que se desborde — la vista ya avisa de esos casos por separado.
    const chosen =
      fitting.length > 0 ? fitting.reduce((a, b) => (a.h <= b.h ? a : b)) : orientations[0];

    const shelf: Shelf = { page, yCm: y, heightCm: chosen.h, usedWidthCm: chosen.w };
    shelves.push(shelf);
    positions.set(item.id, { page, xCm: 0, yCm: y, rotated: chosen.rotated });
    pageNextY[page] = y + chosen.h + gapCm;
  }

  const pageCount = items.length === 0 ? 0 : Math.max(...[...positions.values()].map((p) => p.page)) + 1;

  return { positions, pageCount };
}
