import { forwardRef } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';
import { getSections } from '../utils/sections';

interface Props {
  product: Product;
  widthCm?: number;
}

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return Number(n.toFixed(2)).toString();
}

function sizeVariant(widthCm: number): 'normal' | 'compact' | 'tiny' {
  if (widthCm < 5.5) return 'tiny';
  if (widthCm < 6.5) return 'compact';
  return 'normal';
}

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product, widthCm }, ref) => {
  const sections = getSections(product);
  const seals = sections.seals ? computeSeals(product).filter((s) => s.triggered) : [];
  const showCaffeine = sections.seals && caffeineLegendTriggered(product);
  const showSweeteners = sections.seals && sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';
  const width = widthCm ?? product.labelWidthCm;

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

      <div className={product.twoColumns ? 'label-body label-body-columns' : 'label-body'}>
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

      {sections.activeIngredients && product.activeIngredients.some((i) => i.nameEs || i.amount !== '') && (
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
      )}

      {sections.ingredientsList && product.ingredientsListEs && (
        <div className="text-block">
          <h4>Ingredientes</h4>
          <p>{product.ingredientsListEs}</p>
        </div>
      )}

      {sections.directions && product.directionsEs && (
        <div className="text-block">
          <h4>Modo de uso</h4>
          <p>{product.directionsEs}</p>
        </div>
      )}

      {sections.warnings && product.warningsEs.filter(Boolean).length > 0 && (
        <div className="text-block">
          <h4>Advertencias</h4>
          <ul>
            {product.warningsEs.filter(Boolean).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {sections.allergen && product.allergenEs && (
        <div className="text-block">
          <h4>Alérgenos</h4>
          <p>{product.allergenEs}</p>
        </div>
      )}

      {sections.storage && product.storageEs && (
        <div className="text-block">
          <h4>Conservación</h4>
          <p>{product.storageEs}</p>
        </div>
      )}

      {sections.responsible && product.responsibleEs && (
        <div className="text-block">
          <p className="fine-print">{product.responsibleEs}</p>
        </div>
      )}
      </div>
    </div>
  );
});

NutritionLabel.displayName = 'NutritionLabel';
export default NutritionLabel;
