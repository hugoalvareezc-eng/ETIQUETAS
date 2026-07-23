import { forwardRef } from 'react';
import { Product } from '../types';
import { per100g, computeSeals, caffeineLegendTriggered, sweetenerLegendTriggered } from '../data/nom051';
import { categoryLabel } from '../data/categories';

interface Props {
  product: Product;
}

function fmt(n: number): string {
  if (!isFinite(n)) return '0';
  return Number(n.toFixed(2)).toString();
}

const NutritionLabel = forwardRef<HTMLDivElement, Props>(({ product }, ref) => {
  const seals = computeSeals(product).filter((s) => s.triggered);
  const showCaffeine = caffeineLegendTriggered(product);
  const showSweeteners = sweetenerLegendTriggered(product);
  const unitSuffix = product.isLiquid ? 'ml' : 'g';

  return (
    <div className="nutrition-label" ref={ref}>
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

      {product.activeIngredients.some((i) => i.nameEs || i.amount !== '') && (
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

      {product.ingredientsListEs && (
        <div className="text-block">
          <h4>Ingredientes</h4>
          <p>{product.ingredientsListEs}</p>
        </div>
      )}

      {product.directionsEs && (
        <div className="text-block">
          <h4>Modo de uso</h4>
          <p>{product.directionsEs}</p>
        </div>
      )}

      {product.warningsEs.filter(Boolean).length > 0 && (
        <div className="text-block">
          <h4>Advertencias</h4>
          <ul>
            {product.warningsEs.filter(Boolean).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {product.allergenEs && (
        <div className="text-block">
          <h4>Alérgenos</h4>
          <p>{product.allergenEs}</p>
        </div>
      )}

      {product.storageEs && (
        <div className="text-block">
          <h4>Conservación</h4>
          <p>{product.storageEs}</p>
        </div>
      )}

      {product.responsibleEs && (
        <div className="text-block">
          <p className="fine-print">{product.responsibleEs}</p>
        </div>
      )}
    </div>
  );
});

NutritionLabel.displayName = 'NutritionLabel';
export default NutritionLabel;
