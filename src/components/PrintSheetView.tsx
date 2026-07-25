import { useEffect, useMemo, useRef, useState } from 'react';
import { Category, Product } from '../types';
import { CATEGORIES, categoryLabel } from '../data/categories';
import { PAGE_SIZES } from '../data/pageSizes';
import { packLabels, PackItem } from '../utils/packLabels';
import { pxToCm } from '../utils/units';
import { filterProducts } from '../utils/filterProducts';
import NutritionLabel from './NutritionLabel';

interface Props {
  products: Product[];
}

interface Instance {
  instanceId: string;
  product: Product;
}

function labelCaptionText(product: Product): string {
  const name = product.productNameEs || product.productNameEn || 'Sin nombre';
  return product.flavor ? `${name} · ${product.flavor}` : name;
}

// Tarjeta = etiqueta + una franja angosta con el nombre del producto arriba,
// para poder distinguir a simple vista cuál etiqueta es cuál antes de
// recortarlas cuando la hoja trae varios productos distintos revueltos. Se
// usa tanto para medir (mismo alto real que se va a acomodar) como para el
// render final, así el alto medido siempre incluye la franja.
function LabelCard({
  product,
  widthCm,
  measureRef,
}: {
  product: Product;
  widthCm: number;
  measureRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={measureRef} style={{ width: `${widthCm}cm` }}>
      <div className="label-caption">{labelCaptionText(product)}</div>
      <NutritionLabel product={product} widthCm={widthCm} />
    </div>
  );
}

export default function PrintSheetView({ products }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pageSizeId, setPageSizeId] = useState(PAGE_SIZES[0].id);
  const [marginCm, setMarginCm] = useState(0.8);
  const [gapCm, setGapCm] = useState(0.4);
  const [heights, setHeights] = useState<Record<string, number> | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const filteredProducts = useMemo(() => filterProducts(products, query, category), [products, query, category]);

  const pageSize = PAGE_SIZES.find((p) => p.id === pageSizeId) ?? PAGE_SIZES[0];
  const contentWidthCm = pageSize.widthCm - 2 * marginCm;
  const contentHeightCm = pageSize.heightCm - 2 * marginCm;

  const instances: Instance[] = useMemo(() => {
    const selected = products.filter((p) => (quantities[p.id] ?? 0) > 0);
    const ordered = [...selected].sort((a, b) => b.labelWidthCm - a.labelWidthCm);
    const result: Instance[] = [];
    for (const product of ordered) {
      const qty = quantities[product.id] ?? 0;
      for (let i = 0; i < qty; i++) {
        result.push({ instanceId: `${product.id}_${i}`, product });
      }
    }
    return result;
  }, [products, quantities]);

  const instancesSignature = instances.map((i) => `${i.instanceId}:${i.product.labelWidthCm}`).join('|');
  const measureRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (instances.length === 0) {
      setHeights(null);
      return;
    }
    // Espera al siguiente frame para asegurar que el bloque de medición ya
    // se pintó con el ancho real de cada etiqueta antes de leer su alto.
    const raf = requestAnimationFrame(() => {
      const next: Record<string, number> = {};
      for (const inst of instances) {
        const el = measureRefs.current.get(inst.instanceId);
        if (el) next[inst.instanceId] = pxToCm(el.offsetHeight);
      }
      setHeights(next);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instancesSignature]);

  const packResult = useMemo(() => {
    if (!heights) return null;
    const items: PackItem[] = instances.map((inst) => ({
      id: inst.instanceId,
      widthCm: inst.product.labelWidthCm,
      heightCm: heights[inst.instanceId] ?? 4,
    }));
    return packLabels(items, contentWidthCm, contentHeightCm, gapCm);
  }, [heights, instances, contentWidthCm, contentHeightCm, gapCm]);

  function setQty(id: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  // Selecciona (con 1 copia) todos los productos visibles con el filtro
  // actual, sin tocar la cantidad de los que ya tenían algo capturado.
  function selectAllVisible() {
    setQuantities((prev) => {
      const next = { ...prev };
      for (const p of filteredProducts) {
        if (!next[p.id]) next[p.id] = 1;
      }
      return next;
    });
  }

  const totalLabels = instances.length;
  const pageCount = packResult?.pageCount ?? 0;

  // Una etiqueta solo se marca como "no cabe" si de plano no entra en la
  // hoja ni normal ni girada 90° — si cabe girada, el empaquetado ya la
  // acomoda así y no hace falta advertir nada.
  const oversizedProducts = useMemo(() => {
    if (!heights) return [];
    const seen = new Set<string>();
    const list: { name: string; heightCm: number }[] = [];
    for (const inst of instances) {
      if (seen.has(inst.product.id)) continue;
      const h = heights[inst.instanceId];
      const w = inst.product.labelWidthCm;
      if (!h) continue;
      const fitsNormal = h <= contentHeightCm && w <= contentWidthCm;
      const fitsRotated = w <= contentHeightCm && h <= contentWidthCm;
      if (!fitsNormal && !fitsRotated) {
        seen.add(inst.product.id);
        list.push({ name: inst.product.productNameEs || inst.product.productNameEn || 'Sin nombre', heightCm: h });
      }
    }
    return list;
  }, [heights, instances, contentHeightCm, contentWidthCm]);

  return (
    <div className="print-sheet-view">
      <div className="no-print">
        <h2>Hoja de impresión (varias etiquetas por hoja)</h2>
        <p className="hint">
          Elige cuántas copias de cada etiqueta necesitas. La app las acomoda automáticamente en
          la hoja según el ancho de etiqueta de cada producto (configurable en cada producto, en
          "Datos generales"), probando acomodarlas normales o giradas 90° para desperdiciar el
          menor papel posible. Arriba de cada etiqueta impresa se agrega una franja angosta con el
          nombre del producto, para distinguirlas antes de recortarlas.
        </p>

        <div className="sheet-controls">
          <label>
            Tamaño de hoja
            <select value={pageSizeId} onChange={(e) => setPageSizeId(e.target.value)}>
              {PAGE_SIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Margen de hoja (cm)
            <input
              type="number"
              step="0.1"
              min="0"
              value={marginCm}
              onChange={(e) => setMarginCm(Number(e.target.value))}
            />
          </label>
          <label>
            Espacio entre etiquetas (cm)
            <input
              type="number"
              step="0.1"
              min="0"
              value={gapCm}
              onChange={(e) => setGapCm(Number(e.target.value))}
            />
          </label>
        </div>

        {products.length > 0 && (
          <div className="filter-bar">
            <input
              className="search-input"
              placeholder="Buscar por nombre, marca o sabor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value as Category | 'all')}>
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {filteredProducts.length > 0 && (
              <button type="button" onClick={selectAllVisible}>
                Seleccionar todas las visibles (1 copia c/u)
              </button>
            )}
          </div>
        )}

        <table className="sheet-selection-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Sabor</th>
              <th>Contenido neto</th>
              <th>Categoría</th>
              <th>Ancho etiqueta</th>
              <th>Copias</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.productNameEs || p.productNameEn || 'Sin nombre'}</td>
                <td>{p.flavor || '—'}</td>
                <td>{p.netContent || '—'}</td>
                <td>{categoryLabel(p.category)}</td>
                <td>{p.labelWidthCm} cm</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={quantities[p.id] ?? 0}
                    onChange={(e) => setQty(p.id, Number(e.target.value))}
                    style={{ width: '4rem' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="empty-state">Primero crea al menos un producto en "Mis productos".</p>
        )}

        {products.length > 0 && filteredProducts.length === 0 && (
          <p className="empty-state">No hay productos que coincidan con la búsqueda.</p>
        )}

        {oversizedProducts.length > 0 && (
          <div className="warning-banner">
            <strong>⚠ Estas etiquetas no caben en la hoja ni normales ni giradas 90°:</strong>
            <ul>
              {oversizedProducts.map((o) => (
                <li key={o.name}>
                  {o.name}: {o.heightCm.toFixed(1)} cm de alto (la hoja tiene {contentHeightCm.toFixed(1)} cm
                  disponibles).
                </li>
              ))}
            </ul>
            <p>
              Se van a imprimir de todos modos, pero se van a cortar al final de la hoja. Prueba
              aumentando el ancho de esa etiqueta (para que el texto haga menos renglones) o
              imprímela sola desde "Mis productos".
            </p>
          </div>
        )}

        {totalLabels > 0 && (
          <div className="sheet-summary">
            <p>
              {totalLabels} etiqueta(s) en {pageCount || '…'} hoja(s) tamaño {pageSize.label}.
            </p>
            <button className="primary-btn" onClick={() => window.print()}>
              Imprimir / Guardar PDF
            </button>
            <p className="hint">
              Al imprimir, elige tamaño de papel "{pageSize.id === 'carta' ? 'Carta' : 'A4'}" y
              pon la escala en <strong>100% (tamaño real)</strong>, no "Ajustar a la página", para
              que las etiquetas salgan a su tamaño físico correcto.
            </p>
          </div>
        )}
      </div>

      {/* Bloque de medición oculto: misma tarjeta (etiqueta + franja de
          nombre) que se va a imprimir, sin girar, para saber cuánto alto
          ocupa cada una antes de acomodarlas. */}
      <div style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden' }} aria-hidden="true">
        {instances.map((inst) => (
          <LabelCard
            key={inst.instanceId}
            product={inst.product}
            widthCm={inst.product.labelWidthCm}
            measureRef={(el) => {
              measureRefs.current.set(inst.instanceId, el);
            }}
          />
        ))}
      </div>

      {packResult && (
        <div className="sheet-pages">
          {Array.from({ length: packResult.pageCount }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              className="sheet-page"
              style={{
                width: `${pageSize.widthCm}cm`,
                height: `${pageSize.heightCm}cm`,
                padding: `${marginCm}cm`,
              }}
            >
              <span className="sheet-page-label no-print">Hoja {pageIndex + 1}</span>
              {instances
                .filter((inst) => packResult.positions.get(inst.instanceId)?.page === pageIndex)
                .map((inst) => {
                  const pos = packResult.positions.get(inst.instanceId)!;
                  const naturalWidth = inst.product.labelWidthCm;
                  const naturalHeight = heights?.[inst.instanceId] ?? 0;
                  const footprintWidth = pos.rotated ? naturalHeight : naturalWidth;
                  const footprintHeight = pos.rotated ? naturalWidth : naturalHeight;
                  return (
                    <div
                      key={inst.instanceId}
                      style={{
                        position: 'absolute',
                        left: `${pos.xCm}cm`,
                        top: `${pos.yCm}cm`,
                        width: `${footprintWidth}cm`,
                        height: `${footprintHeight}cm`,
                        overflow: 'hidden',
                      }}
                    >
                      {pos.rotated ? (
                        <div
                          style={{
                            width: `${naturalWidth}cm`,
                            transformOrigin: 'top left',
                            transform: 'rotate(90deg) translateY(-100%)',
                          }}
                        >
                          <LabelCard product={inst.product} widthCm={naturalWidth} />
                        </div>
                      ) : (
                        <LabelCard product={inst.product} widthCm={naturalWidth} />
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
