import { forwardRef, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';
import { getSections } from '../utils/sections';
import { balanceColumns, ColumnSplit } from '../utils/balanceColumns';
import { pxToCm } from '../utils/units';

interface Props {
  product: Product;
  widthCm?: number;
  onOverflowChange?: (overflowing: boolean) => void;
}

// Alto mínimo al que se permite encoger la letra para que el contenido quepa
// en un alto fijo, antes de simplemente avisar que ya no cabe.
const MIN_HEIGHT_FIT_SCALE = 0.6;

interface Block {
  key: string;
  node: ReactNode;
}

const COLUMN_GAP_CM = 0.5;
// Ancho de referencia para el que el texto se ve a tamaño "normal" (0.9rem).
// Por debajo de esto, la letra y el "relleno" (sellos, márgenes, celdas)
// se van achicando en proporción al ancho real, en vez de quedarse fijos
// en un tamaño mínimo y amontonarse cuando la etiqueta es muy angosta.
const BASELINE_WIDTH_CM = 9;
const MIN_WIDTH_SCALE = 0.45;

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
              {product.nutrients.some((n) => n.dailyValuePercent !== '' && n.dailyValuePercent !== undefined) && (
                <th>% VD*</th>
              )}
            </tr>
          </thead>
          <tbody>
            {product.nutrients.map((n) => (
              <tr key={n.id} className={n.indent ? 'indent' : ''}>
                <td>{n.labelEs || n.labelEn || '—'}</td>
                <td>{n.amount === '' ? '—' : `${fmt(per100g(product, n))} ${n.unit}`}</td>
                <td>{n.amount === '' ? '—' : `${fmt(n.amount)} ${n.unit}`}</td>
                {product.nutrients.some((x) => x.dailyValuePercent !== '' && x.dailyValuePercent !== undefined) && (
                  <td>{n.dailyValuePercent === '' || n.dailyValuePercent === undefined ? '—' : `${n.dailyValuePercent}%`}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fine-print">*% Valor Diario con base en una dieta de 2000 kcal.</p>
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
            <tbody>
              {product.activeIngredients
                .filter((i) => i.nameEs || i.amount !== '')
                .map((i) => (
                  <tr key={i.id}>
                    <td>{i.nameEs || i.nameEn}</td>
                    <td>{i.amount === '' ? '—' : `${i.amount} ${i.unit}`}</td>
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

  return blocks;
}

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product, widthCm, onOverflowChange }, ref) => {
  const sections = getSections(product);
  const seals = sections.seals ? computeSeals(product).filter((s) => s.triggered) : [];
  const showCaffeine = sections.seals && caffeineLegendTriggered(product);
  const showSweeteners = sections.seals && sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';
  const width = widthCm ?? product.labelWidthCm;
  const columnWidth = product.twoColumns ? (width - COLUMN_GAP_CM) / 2 : width;
  const baseFontSizeRem = 0.9 * widthScale(width) * (product.compact ? 0.85 : 1);

  const blocks = useMemo(
    () => buildBlocks(product, sections, unitSuffix),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, unitSuffix],
  );
  const blocksKey = blocks.map((b) => b.key).join(',');

  const blockRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [split, setSplit] = useState<ColumnSplit | null>(null);

  useLayoutEffect(() => {
    if (!product.twoColumns) {
      setSplit(null);
      return;
    }
    const items = blocks.map((b) => ({ key: b.key, height: blockRefs.current.get(b.key)?.offsetHeight ?? 0 }));
    setSplit(balanceColumns(items));
    // Re-medir cuando cambian los bloques, el ancho de columna o se activa/desactiva el modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.twoColumns, blocksKey, columnWidth]);

  // Si se fijó un alto de etiqueta, encoge la letra lo necesario para que el
  // contenido quepa dentro de ese alto (con un piso mínimo de legibilidad).
  // Si ni así cabe, se avisa hacia afuera con onOverflowChange en vez de
  // dejar que el contenido se desborde silenciosamente.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [heightFitScale, setHeightFitScale] = useState(1);
  const [heightOverflow, setHeightOverflow] = useState(false);
  const fitSignature = `${product.labelHeightCm}|${blocksKey}|${width}|${product.compact}|${product.twoColumns}|${split ? 'split' : 'nosplit'}`;
  // El ajuste de escala por alto fijo mide una sola vez por firma de
  // contenido y ya no vuelve a tocar el estado después de eso. El
  // texto puede reacomodarse en renglones distintos según el tamaño de
  // letra, así que "medir -> ajustar -> volver a medir" puede no converger
  // nunca y generar un ciclo infinito de renders; por eso aquí se acepta
  // una sola pasada (aproximada) en vez de iterar hasta encajar exacto.
  const fitPhase = useRef<{ signature: string; phase: 'measuring' | 'done' }>({
    signature: '',
    phase: 'done',
  });

  useLayoutEffect(() => {
    if (!product.labelHeightCm) {
      if (heightFitScale !== 1) setHeightFitScale(1);
      if (heightOverflow) setHeightOverflow(false);
      fitPhase.current = { signature: fitSignature, phase: 'done' };
      return;
    }

    if (fitPhase.current.signature !== fitSignature) {
      fitPhase.current = { signature: fitSignature, phase: 'measuring' };
      if (heightFitScale !== 1) {
        setHeightFitScale(1);
        return; // se mide en el siguiente pase, ya renderizado a escala 1
      }
    }

    if (fitPhase.current.phase === 'done') return;

    const el = rootRef.current;
    if (!el) return;
    // scrollHeight (no offsetHeight) porque el propio div ya trae
    // "overflow: hidden" + alto fijo por CSS; offsetHeight reportaría el
    // alto ya recortado en vez del alto real que pide el contenido.
    const naturalCm = pxToCm(el.scrollHeight);
    const targetCm = product.labelHeightCm as number;
    fitPhase.current = { signature: fitSignature, phase: 'done' };
    if (naturalCm > targetCm + 0.02) {
      const needed = Math.max(MIN_HEIGHT_FIT_SCALE, targetCm / naturalCm);
      setHeightFitScale(needed);
      setHeightOverflow(needed <= MIN_HEIGHT_FIT_SCALE + 0.001);
    } else {
      setHeightOverflow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignature, heightFitScale]);

  useEffect(() => {
    onOverflowChange?.(heightOverflow);
  }, [heightOverflow, onOverflowChange]);

  const fontSizeRem = baseFontSizeRem * heightFitScale;

  const showBalanced = product.twoColumns && split;
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
        fontSize: `${fontSizeRem.toFixed(3)}rem`,
        ...(product.labelHeightCm
          ? { height: `${product.labelHeightCm}cm`, overflow: 'hidden' }
          : null),
      }}
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = el;
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
          <div className="label-column" style={{ width: `${columnWidth}cm` }}>
            {split!.left.map((key) => blockMap.get(key)).filter((b): b is Block => !!b).map(renderBlock)}
          </div>
          <div className="label-column" style={{ width: `${columnWidth}cm` }}>
            {split!.right.map((key) => blockMap.get(key)).filter((b): b is Block => !!b).map(renderBlock)}
          </div>
        </div>
      ) : (
        <div className="label-body">
          {product.twoColumns ? (
            // Primer render mientras se mide cada bloque a su ancho de columna final.
            <div style={{ width: `${columnWidth}cm` }}>{blocks.map(renderBlock)}</div>
          ) : (
            blocks.map(renderBlock)
          )}
        </div>
      )}
    </div>
  );
});

NutritionLabel.displayName = 'NutritionLabel';
export default NutritionLabel;
