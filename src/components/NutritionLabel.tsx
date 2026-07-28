import { forwardRef, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';
import { getSections } from '../utils/sections';
import { balanceColumns, suggestColumnCount, ColumnSplit } from '../utils/balanceColumns';
import { cmToPx } from '../utils/units';

interface Props {
  product: Product;
  widthCm?: number;
  onOverflowChange?: (overflowing: boolean) => void;
  onColumnSuggestion?: (suggestedColumnCount: number | null) => void;
  // Qué tan chico se dejó el contenido (transform: scale) para caber en el
  // alto fijo. 1 = tamaño normal, sin reescalar. Sirve para que quien
  // exporte a PNG compense con más resolución y no salga borroso/pixeleado.
  onScaleChange?: (scale: number) => void;
}

interface Block {
  key: string;
  node: ReactNode;
}

export const COLUMN_GAP_CM = 0.5;
// Ancho de referencia para el que el texto se ve a tamaño "normal" (0.9rem).
// Por debajo de esto, la letra y el "relleno" (sellos, márgenes, celdas)
// se van achicando en proporción al ancho real, en vez de quedarse fijos
// en un tamaño mínimo y amontonarse cuando la etiqueta es muy angosta.
const BASELINE_WIDTH_CM = 9;
const MIN_WIDTH_SCALE = 0.45;

// Búsqueda del ancho de "lienzo" interno con el que el contenido, ya
// reescalado para que el ancho quede exacto, también llena el alto pedido.
const MAX_FIT_ITERATIONS = 14;
const FIT_TOLERANCE_PX = 1.5;
// scrollHeight viene redondeado a entero y los sub-píxeles de cada bloque se
// van acumulando, así que el alto medido puede quedar un pelo corto del real.
// Este colchón (~0.1 mm impreso) asegura que el contenido nunca termine
// recortado por el borde de abajo.
const FIT_SAFETY_PX = 5;
// Hasta dónde se permite estirar o encoger ese lienzo respecto al ancho
// pedido. Los extremos solo se alcanzan con contenidos absurdos.
const MIN_LAYOUT_FACTOR = 0.4;
const MAX_LAYOUT_FACTOR = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return Number(n.toFixed(2)).toString();
}

function widthScale(widthCm: number): number {
  const raw = widthCm / BASELINE_WIDTH_CM;
  return Math.max(MIN_WIDTH_SCALE, Math.min(1, raw));
}

function buildBlocks(product: Product, sections: ReturnType<typeof getSections>, unitSuffix: string): Block[] {
  const blocks: Block[] = [];

  const hasDV = product.nutrients.some((n) => n.dailyValuePercent !== '' && n.dailyValuePercent !== undefined);
  const hasSecondServing = product.secondServingSizeText !== '' && product.secondServingScale !== '';
  const secondServingScale = product.secondServingScale as number;

  blocks.push({
    key: 'nutrimental',
    node: (
      <div className="nutrimental-box">
        <h3>INFORMACIÓN NUTRIMENTAL</h3>
        <p>
          Tamaño de la porción: {product.servingSizeText || '—'}
          <br />
          Porciones por envase: {product.servingsPerContainer || '—'}
        </p>
        <table className="nutrimental-table">
          <thead>
            <tr>
              <th>Nutrimento</th>
              <th>Por 100 {unitSuffix}</th>
              <th>Por porción</th>
              {hasSecondServing && <th>Por {product.secondServingSizeText}</th>}
              {hasDV && <th>% VD*</th>}
            </tr>
          </thead>
          <tbody>
            {product.nutrients.map((n) => (
              <tr key={n.id} className={n.indent ? 'indent' : ''}>
                <td>{n.labelEs || n.labelEn || '—'}</td>
                <td>{n.amount === '' ? '—' : `${fmt(per100g(product, n))} ${n.unit}`}</td>
                <td>{n.amount === '' ? '—' : `${fmt(n.amount)} ${n.unit}`}</td>
                {hasSecondServing && (
                  <td>{n.amount === '' ? '—' : `${fmt(n.amount * secondServingScale)} ${n.unit}`}</td>
                )}
                {hasDV && (
                  <td>{n.dailyValuePercent === '' || n.dailyValuePercent === undefined ? '—' : `${n.dailyValuePercent}%`}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {hasDV && <p className="fine-print">*% Valor Diario con base en una dieta de 2000 kcal.</p>}
      </div>
    ),
  });

  if (sections.activeIngredients && product.activeIngredients.some((i) => i.nameEs || i.amount !== '')) {
    blocks.push({
      key: 'activeIngredients',
      node: (
        <div className="active-ingredients-box">
          <h3>Ingredientes activos</h3>
          <table className="nutrimental-table">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th>Por 100 {unitSuffix}</th>
                <th>Por porción</th>
                {hasSecondServing && <th>Por {product.secondServingSizeText}</th>}
              </tr>
            </thead>
            <tbody>
              {product.activeIngredients
                .filter((i) => i.nameEs || i.amount !== '')
                .map((i) => (
                  <tr key={i.id}>
                    <td>{i.nameEs || i.nameEn}</td>
                    <td>{i.amount === '' ? '—' : `${fmt(per100g(product, i))} ${i.unit}`}</td>
                    <td>{i.amount === '' ? '—' : `${i.amount} ${i.unit}`}</td>
                    {hasSecondServing && (
                      <td>{i.amount === '' ? '—' : `${fmt((i.amount as number) * secondServingScale)} ${i.unit}`}</td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ),
    });
  }

  if (sections.ingredientsList && product.ingredientsListEs) {
    blocks.push({
      key: 'ingredientsList',
      node: (
        <div className="text-block">
          <h4>Ingredientes</h4>
          <p>{product.ingredientsListEs}</p>
        </div>
      ),
    });
  }

  if (sections.directions && product.directionsEs) {
    blocks.push({
      key: 'directions',
      node: (
        <div className="text-block">
          <h4>Modo de uso</h4>
          <p>{product.directionsEs}</p>
        </div>
      ),
    });
  }

  if (sections.warnings && product.warningsEs.filter(Boolean).length > 0) {
    blocks.push({
      key: 'warnings',
      node: (
        <div className="text-block">
          <h4>Advertencias</h4>
          <ul>
            {product.warningsEs.filter(Boolean).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  if (sections.allergen && product.allergenEs) {
    blocks.push({
      key: 'allergen',
      node: (
        <div className="text-block">
          <h4>Alérgenos</h4>
          <p>{product.allergenEs}</p>
        </div>
      ),
    });
  }

  if (sections.storage && product.storageEs) {
    blocks.push({
      key: 'storage',
      node: (
        <div className="text-block">
          <h4>Conservación</h4>
          <p>{product.storageEs}</p>
        </div>
      ),
    });
  }

  if (sections.disclaimer && product.disclaimerEs) {
    blocks.push({
      key: 'disclaimer',
      node: (
        <div className="text-block">
          <p className="disclaimer-text">{product.disclaimerEs}</p>
        </div>
      ),
    });
  }

  if (sections.responsible && product.responsibleEs) {
    blocks.push({
      key: 'responsible',
      node: (
        <div className="text-block">
          <p className="fine-print">{product.responsibleEs}</p>
        </div>
      ),
    });
  }

  if (sections.importedBy && product.importedByEs) {
    blocks.push({
      key: 'importedBy',
      node: (
        <div className="text-block">
          <p className="fine-print">{product.importedByEs}</p>
        </div>
      ),
    });
  }

  return blocks;
}

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product, widthCm, onOverflowChange, onColumnSuggestion, onScaleChange }, ref) => {
  const sections = getSections(product);
  const seals = sections.seals ? computeSeals(product).filter((s) => s.triggered) : [];
  const showCaffeine = sections.seals && caffeineLegendTriggered(product);
  const showSweeteners = sections.seals && sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';
  const width = widthCm ?? product.labelWidthCm;

  const blocks = useMemo(
    () => buildBlocks(product, sections, unitSuffix),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, unitSuffix],
  );
  const blocksKey = blocks.map((b) => b.key).join(',');
  // blocksKey solo dice QUÉ bloques hay, no qué dicen: dos productos
  // distintos con las mismas secciones activadas dan exactamente la misma
  // llave. Sin esta huella del contenido real, al saltar de un producto a
  // otro con las mismas medidas se reutilizaba el ajuste del anterior y la
  // etiqueta quedaba mal medida.
  const contentFingerprint = useMemo(() => {
    const raw = JSON.stringify(product);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) | 0;
    return `${raw.length}:${hash}`;
  }, [product]);

  const blockRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [split, setSplit] = useState<ColumnSplit | null>(null);
  const [columnSuggestion, setColumnSuggestion] = useState<number | null>(null);
  // Número de columnas que realmente se dibujan: arranca en lo que pidió el
  // usuario, pero el efecto de abajo lo puede bajar solo (nunca subirlo) si
  // menos columnas aprovechan mejor el ancho — igual que el alto se
  // reescala solo a lo que el contenido necesita, en vez de solo avisar y
  // dejar que la persona lo cambie a mano.
  const [effectiveColumnCount, setEffectiveColumnCount] = useState<number>(product.columnCount);

  useLayoutEffect(() => {
    setEffectiveColumnCount(product.columnCount);
    // El usuario pidió un número de columnas distinto o cambió el
    // contenido: se vuelve a partir de ahí: el efecto de abajo decide si
    // ese número conviene tal cual o si se reduce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.columnCount, contentFingerprint]);

  // Ancho del "lienzo" interno donde se acomoda el contenido antes de
  // reescalarlo. Normalmente es el ancho pedido; cuando hay alto fijo, el
  // efecto de ajuste lo mueve hasta encontrar el que llena la etiqueta
  // completa (ver comentario largo más abajo).
  const [layoutWidthCm, setLayoutWidthCm] = useState(width);
  const columnWidth =
    effectiveColumnCount > 1
      ? (layoutWidthCm - COLUMN_GAP_CM * (effectiveColumnCount - 1)) / effectiveColumnCount
      : layoutWidthCm;
  // La letra (y todo lo demás medido en "em": sellos, rellenos, márgenes) se
  // escala según el ancho real de cada columna, no el ancho total de la
  // etiqueta — si no, con varias columnas la letra queda de tamaño normal
  // aunque cada columna sea angosta, y el texto largo se parte feo a media
  // palabra en vez de simplemente verse más chico.
  const baseFontSizeRem = 0.9 * widthScale(columnWidth) * (product.compact ? 0.85 : 1);

  useLayoutEffect(() => {
    if (effectiveColumnCount <= 1) {
      setSplit(null);
      setColumnSuggestion(null);
      return;
    }
    const items = blocks.map((b) => ({ key: b.key, height: blockRefs.current.get(b.key)?.offsetHeight ?? 0 }));
    // Si un bloque que no se puede partir (ej. la tabla nutrimental) ya es
    // tan alto por sí solo que ninguna combinación del resto va a llenar
    // las demás columnas, usar tantas columnas deja espacio en blanco que
    // no tiene arreglo — se baja el número de columnas automáticamente (el
    // siguiente ciclo del efecto vuelve a medir con el ancho de columna ya
    // más grande) en vez de solo mostrar una advertencia.
    // Esa decisión se toma solo con el lienzo en su ancho base: durante la
    // búsqueda de ajuste el lienzo cambia de ancho a propósito, y no
    // queremos que eso ande moviendo el número de columnas de ida y vuelta.
    if (layoutWidthCm === width) {
      const suggestion = suggestColumnCount(items, effectiveColumnCount);
      if (suggestion < effectiveColumnCount) {
        setSplit(null);
        setEffectiveColumnCount(suggestion);
        return;
      }
    }
    setSplit(balanceColumns(items, effectiveColumnCount));
    setColumnSuggestion(effectiveColumnCount < product.columnCount ? effectiveColumnCount : null);
    // Re-medir cuando cambian los bloques, el ancho de columna, el número de
    // columnas efectivo, o cambia el tamaño de letra (modo compacto): el
    // reparto de bloques por columna depende de cuánto mide cada uno, y eso
    // cambia con la letra más chica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveColumnCount, blocksKey, columnWidth, product.compact, layoutWidthCm, width]);

  useEffect(() => {
    onColumnSuggestion?.(columnSuggestion);
  }, [columnSuggestion, onColumnSuggestion]);

  // Cómo se llena la etiqueta completa (ancho Y alto) sin salirse:
  //
  // Reescalar el contenido para que quepa de alto también lo angosta — un
  // scale(0.6) deja el contenido al 60% del ancho, o sea una franja en
  // blanco a la derecha. Por eso el contenido NO se arma al ancho final:
  // se arma en un "lienzo" interno de ancho variable y se reescala por el
  // factor exacto ancho_pedido / ancho_lienzo, así el ancho SIEMPRE queda
  // clavado sin importar cuánto se haya encogido o agrandado.
  //
  // Falta entonces escoger el ancho de lienzo con el que el alto también
  // dé justo. Al ensanchar el lienzo el contenido fluye más ancho y
  // necesita menos alto, así que se busca el ancho donde
  // alto_natural * (ancho_pedido / ancho_lienzo) == alto_pedido. Como el
  // alto va casi inverso al ancho, cada vuelta multiplica el ancho por
  // sqrt(alto_que_dio / alto_pedido) y se llega en pocas pasadas.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [heightOverflow, setHeightOverflow] = useState(false);
  // El ancho final siempre sale exacto por construcción.
  const contentScale = layoutWidthCm > 0 ? width / layoutWidthCm : 1;
  const fitSignature = `${product.labelHeightCm}|${contentFingerprint}|${width}|${product.compact}|${effectiveColumnCount}`;
  const fitRef = useRef<{ signature: string; iter: number; bestFit: number | null }>({
    signature: '',
    iter: 0,
    bestFit: null,
  });

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    // Sin alto fijo no hay nada que ajustar: se dibuja al ancho pedido tal cual.
    if (!product.labelHeightCm || width <= 0) {
      fitRef.current = { signature: fitSignature, iter: 0, bestFit: null };
      if (layoutWidthCm !== width) setLayoutWidthCm(width);
      if (heightOverflow) setHeightOverflow(false);
      return;
    }

    // Cambió el contenido o el tamaño pedido: se reinicia la búsqueda.
    if (fitRef.current.signature !== fitSignature) {
      fitRef.current = { signature: fitSignature, iter: 0, bestFit: null };
      if (layoutWidthCm !== width) {
        setLayoutWidthCm(width);
        return;
      }
    }

    const targetWpx = cmToPx(width);
    const targetHpx = cmToPx(product.labelHeightCm as number);
    const layoutWpx = cmToPx(layoutWidthCm);
    const naturalHpx = el.scrollHeight;
    if (!naturalHpx || !layoutWpx || !targetHpx) return;

    // Alto que va a quedar una vez reescalado para que el ancho dé exacto.
    const scaledHpx = (naturalHpx * targetWpx) / layoutWpx;
    // Se apunta a un pelín menos del alto real (el colchón de seguridad):
    // así el redondeo nunca termina recortando la última línea.
    const usableTargetHpx = Math.max(1, targetHpx - FIT_SAFETY_PX);

    // Solo cuenta como candidato el lienzo que cabe de verdad. Nos quedamos
    // con el más angosto que quepa, que es el que deja la letra más grande
    // y menos hueco abajo.
    const overshooting = scaledHpx > usableTargetHpx;
    if (!overshooting && (fitRef.current.bestFit === null || layoutWidthCm < fitRef.current.bestFit)) {
      fitRef.current.bestFit = layoutWidthCm;
    }

    let nextWidthCm = clamp(
      layoutWidthCm * Math.sqrt(scaledHpx / usableTargetHpx),
      width * MIN_LAYOUT_FACTOR,
      width * MAX_LAYOUT_FACTOR,
    );
    // Si estamos apenas pasados, el paso calculado es minúsculo y nos
    // dejaría parados justo por encima del límite: se ensancha a propósito
    // hasta bajar del borde.
    if (overshooting && nextWidthCm - layoutWidthCm < 0.01) {
      nextWidthCm = clamp(layoutWidthCm * 1.01, width * MIN_LAYOUT_FACTOR, width * MAX_LAYOUT_FACTOR);
    }
    const stalled = Math.abs(nextWidthCm - layoutWidthCm) < 0.005;
    const converged =
      (!overshooting && usableTargetHpx - scaledHpx <= FIT_TOLERANCE_PX) ||
      (fitRef.current.bestFit !== null && stalled) ||
      fitRef.current.iter >= MAX_FIT_ITERATIONS;

    if (converged) {
      // Siempre se aterriza en un lienzo que sí cabe, nunca en uno que se
      // pase: entre quedar corto y salirse, se queda corto.
      const finalWidthCm = fitRef.current.bestFit ?? layoutWidthCm;
      setHeightOverflow(fitRef.current.bestFit === null);
      if (finalWidthCm !== layoutWidthCm) setLayoutWidthCm(finalWidthCm);
      return;
    }

    fitRef.current.iter += 1;
    setLayoutWidthCm(nextWidthCm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignature, layoutWidthCm, split]);

  useEffect(() => {
    onOverflowChange?.(heightOverflow);
  }, [heightOverflow, onOverflowChange]);

  useEffect(() => {
    onScaleChange?.(contentScale);
  }, [contentScale, onScaleChange]);

  const fontSizeRem = baseFontSizeRem;

  const showBalanced = effectiveColumnCount > 1 && split;
  const blockMap = new Map(blocks.map((b) => [b.key, b]));

  function renderBlock(block: Block) {
    return (
      <div
        key={block.key}
        ref={(el) => {
          blockRefs.current.set(block.key, el);
        }}
      >
        {block.node}
      </div>
    );
  }

  return (
    <div
      className="nutrition-label"
      data-compact={product.compact ? 'true' : undefined}
      style={{
        width: `${width}cm`,
        // El alto fijo que pide el usuario SIEMPRE se respeta tal cual: el
        // contenido se dibuja a tamaño normal en el envoltorio interno y se
        // reescala completo (como una imagen) para que quepa exacto — nunca
        // se agranda la etiqueta ni se deja "salir" nada de esta caja.
        position: 'relative',
        ...(product.labelHeightCm ? { height: `${product.labelHeightCm}cm`, overflow: 'hidden' } : null),
      }}
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = el;
      }}
    >
      <div
        className="nutrition-label-inner"
        ref={innerRef}
        style={{
          fontSize: `${fontSizeRem.toFixed(3)}rem`,
          // El contenido se acomoda a este ancho y luego se reescala al
          // ancho real de la etiqueta: por eso el ancho siempre queda
          // exacto, sin franja en blanco a la derecha.
          width: `${layoutWidthCm}cm`,
          ...(contentScale !== 1
            ? { transform: `scale(${contentScale})`, transformOrigin: 'top left' }
            : null),
        }}
      >
        {sections.header && (
          <div className="label-brand">
            <span className="badge">{categoryLabel(product.category)}</span>
            <h2>{product.productNameEs || 'Nombre del producto'}</h2>
            <p className="muted">
              {product.brand} {product.flavor && `· Sabor: ${product.flavor}`}
              {product.netContent && ` · Contenido neto: ${product.netContent}`}
            </p>
          </div>
        )}

        {seals.length > 0 && (
          <div className="seals-row">
            {seals.map((s) => (
              <div key={s.id} className="seal" title={s.detail}>
                {s.label}
              </div>
            ))}
          </div>
        )}

        {(showCaffeine || showSweeteners) && (
          <div className="legends">
            {showCaffeine && <div className="legend">CONTIENE CAFEÍNA. EVITAR EN NIÑOS.</div>}
            {showSweeteners && <div className="legend">CONTIENE EDULCORANTES, NO RECOMENDABLE EN NIÑOS.</div>}
          </div>
        )}

        {showBalanced ? (
          <div className="label-body label-body-balanced" style={{ gap: `${COLUMN_GAP_CM}cm` }}>
            {split!.map((columnKeys, i) => (
              <div key={i} className="label-column" style={{ width: `${columnWidth}cm` }}>
                {columnKeys.map((key) => blockMap.get(key)).filter((b): b is Block => !!b).map(renderBlock)}
              </div>
            ))}
          </div>
        ) : (
          <div className="label-body">
            {effectiveColumnCount > 1 ? (
              // Primer render mientras se mide cada bloque a su ancho de columna final.
              <div style={{ width: `${columnWidth}cm` }}>{blocks.map(renderBlock)}</div>
            ) : (
              blocks.map(renderBlock)
            )}
          </div>
        )}
      </div>
      {heightOverflow && product.labelHeightCm && (
        // Con el reescalado por transform esto ya casi nunca debería
        // pasar (matemáticamente el contenido siempre cabe); se deja como
        // red de seguridad para casos degenerados (ej. alto fijo de 0).
        <div
          className="no-print"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${product.labelHeightCm}cm`,
            borderTop: '2px dashed #d33',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <span
            style={{
              position: 'relative',
              top: '-0.6em',
              background: '#fff',
              color: '#d33',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0 0.4em',
            }}
          >
            ↑ fin de la etiqueta ({product.labelHeightCm} cm) — lo de abajo no cabe ↓
          </span>
        </div>
      )}
    </div>
  );
});

NutritionLabel.displayName = 'NutritionLabel';
export default NutritionLabel;
