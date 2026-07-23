import { forwardRef, ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';
import { getSections } from '../utils/sections';
import { balanceColumns, ColumnSplit } from '../utils/balanceColumns';

interface Props {
  product: Product;
  widthCm?: number;
}

interface Block {
  key: string;
  node: ReactNode;
}

const COLUMN_GAP_CM = 0.5;

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return Number(n.toFixed(2)).toString();
}

function sizeVariant(widthCm: number): 'normal' | 'compact' | 'tiny' {
  if (widthCm < 5.5) return 'tiny';
  if (widthCm < 6.5) return 'compact';
  return 'normal';
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

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product, widthCm }, ref) => {
  const sections = getSections(product);
  const seals = sections.seals ? computeSeals(product).filter((s) => s.triggered) : [];
  const showCaffeine = sections.seals && caffeineLegendTriggered(product);
  const showSweeteners = sections.seals && sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';
  const width = widthCm ?? product.labelWidthCm;
  const columnWidth = product.twoColumns ? (width - COLUMN_GAP_CM) / 2 : width;

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
      data-size={sizeVariant(width)}
      style={{ width: `${width}cm` }}
      ref={ref}
    >
      <div className="label-brand">
        <span className="badge">{categoryLabel(product.category)}</span>
        <h2>{product.productNameEs || 'Nombre del producto'}</h2>
        {product.denominacionEs && <p className="denominacion">{product.denominacionEs}</p>}
        <p className="muted">
          {product.brand} {product.flavor && `· Sabor: ${product.flavor}`}
          {product.netContent && ` · Contenido neto: ${product.netContent}`}
        </p>
      </div>

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
