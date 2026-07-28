import { forwardRef, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';
import { getSections } from '../utils/sections';
import { balanceColumns, ColumnSplit } from '../utils/balanceColumns';
import { cmToPx } from '../utils/units';

interface Props {
  product: Product;
  widthCm?: number;
  onOverflowChange?: (overflowing: boolean) => void;
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

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product, widthCm, onOverflowChange }, ref) => {
  const sections = getSections(product);
  const seals = sections.seals ? computeSeals(product).filter((s) => s.triggered) : [];
  const showCaffeine = sections.seals && caffeineLegendTriggered(product);
  const showSweeteners = sections.seals && sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';
  const width = widthCm ?? product.labelWidthCm;
  const columnWidth =
    product.columnCount > 1
      ? (width - COLUMN_GAP_CM * (product.columnCount - 1)) / product.columnCount
      : width;
  // La letra (y todo lo demás medido en "em": sellos, rellenos, márgenes) se
  // escala según el ancho real de cada columna, no el ancho total de la
  // etiqueta — si no, con varias columnas la letra queda de tamaño normal
  // aunque cada columna sea angosta, y el texto largo se parte feo a media
  // palabra en vez de simplemente verse más chico.
  const baseFontSizeRem = 0.9 * widthScale(columnWidth) * (product.compact ? 0.85 : 1);

  const blocks = useMemo(
    () => buildBlocks(product, sections, unitSuffix),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, unitSuffix],
  );
  const blocksKey = blocks.map((b) => b.key).join(',');

  const blockRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [split, setSplit] = useState<ColumnSplit | null>(null);

  useLayoutEffect(() => {
    if (product.columnCount <= 1) {
      setSplit(null);
      return;
    }
    const items = blocks.map((b) => ({ key: b.key, height: blockRefs.current.get(b.key)?.offsetHeight ?? 0 }));
    setSplit(balanceColumns(items, product.columnCount));
    // Re-medir cuando cambian los bloques, el ancho de columna, el número de
    // columnas, o cambia el tamaño de letra (modo compacto): el reparto de
    // bloques por columna depende de cuánto mide cada uno, y eso cambia con
    // la letra más chica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.columnCount, blocksKey, columnWidth, product.compact]);

  // Si se fijó un alto de etiqueta, el contenido se dibuja a su tamaño
  // normal (natural) en un envoltorio interno y luego se le aplica un
  // "transform: scale()" para que quepa exacto en ese alto — igual que
  // reescalar una imagen grande a una más chica, en vez de ir probando
  // tamaños de letra distintos hasta que quepa. transform no cambia el
  // layout/reflow del texto, así que scrollHeight siempre mide el alto
  // natural real sin importar qué tan chico se esté mostrando, y el
  // cálculo es exacto en una sola pasada (nunca se desborda).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [contentScale, setContentScale] = useState(1);
  const [heightOverflow, setHeightOverflow] = useState(false);
  const fitSignature = `${product.labelHeightCm}|${blocksKey}|${width}|${product.compact}|${product.columnCount}|${split ? 'split' : 'nosplit'}`;

  useLayoutEffect(() => {
    if (!product.labelHeightCm) {
      if (contentScale !== 1) setContentScale(1);
      if (heightOverflow) setHeightOverflow(false);
      return;
    }
    const el = innerRef.current;
    if (!el) return;
    const naturalPx = el.scrollHeight;
    const targetPx = cmToPx(product.labelHeightCm as number);
    if (!naturalPx || !isFinite(naturalPx)) return;
    const needed = Math.min(1, targetPx / naturalPx);
    setContentScale(isFinite(needed) && needed > 0 ? needed : 1);
    setHeightOverflow(!isFinite(needed) || needed <= 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignature]);

  useEffect(() => {
    onOverflowChange?.(heightOverflow);
  }, [heightOverflow, onOverflowChange]);

  const fontSizeRem = baseFontSizeRem;

  const showBalanced = product.columnCount > 1 && split;
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
          ...(contentScale < 1
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
            {product.columnCount > 1 ? (
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
