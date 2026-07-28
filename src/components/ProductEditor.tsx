import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { DictionaryEntry, Product } from '../types';
import ProductForm from './ProductForm';
import NutritionLabel from './NutritionLabel';
import { BASE_DICTIONARY } from '../data/dictionary';
import { pxToCm } from '../utils/units';

const PRINT_AREA_PADDING_CM = 1; // debe coincidir con ".print-area { padding: 1cm }" en @media print
const SINGLE_PRINT_STYLE_ID = 'single-label-page-size';
const BASE_PIXEL_RATIO = 3;
// Tope para que un contenido reescalado a algo extremo (ej. 0.05) no genere
// un PNG absurdamente pesado o tarde una eternidad en generarse.
const MAX_PIXEL_RATIO = 18;

interface Props {
  product: Product;
  customDictionary: DictionaryEntry[];
  onChange: (product: Product) => void;
  onBack: () => void;
  onAddDictionaryEntry: (entry: DictionaryEntry) => void;
}

export default function ProductEditor({ product, customDictionary, onChange, onBack }: Props) {
  const labelRef = useRef<HTMLDivElement>(null);
  const dictionary = useMemo(() => [...customDictionary, ...BASE_DICTIONARY], [customDictionary]);
  const [heightOverflow, setHeightOverflow] = useState(false);
  const [columnSuggestion, setColumnSuggestion] = useState<number | null>(null);
  const [contentScale, setContentScale] = useState(1);

  async function exportPng() {
    if (!labelRef.current) return;
    // El contenido se reescala visualmente (transform: scale) para caber en
    // el alto fijo; sin compensar, html-to-image lo rasteriza a la
    // resolución "reducida" y sale borroso/pixeleado. Se sube el pixelRatio
    // en proporción inversa a cuánto se encogió, para que la resolución
    // final sea la misma que si no se hubiera reescalado nada.
    const pixelRatio = Math.min(MAX_PIXEL_RATIO, BASE_PIXEL_RATIO / Math.max(contentScale, 0.01));
    const dataUrl = await toPng(labelRef.current, { pixelRatio, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    const name = (product.productNameEs || product.productNameEn || 'etiqueta').replace(/\s+/g, '_');
    link.download = `${name}.png`;
    link.href = dataUrl;
    link.click();
  }

  function printLabel() {
    // Sin esto, la hoja impresa usa el tamaño de papel por defecto (Carta/A4
    // completo) y deja un montón de espacio en blanco debajo de una sola
    // etiqueta chica. Aquí se fuerza el tamaño de página al tamaño real de
    // la etiqueta (+ el margen de impresión), solo mientras dura esta
    // impresión — se quita después para no afectar la hoja de varias
    // etiquetas, que sí necesita tamaño Carta/A4 normal.
    const widthCm = product.labelWidthCm + PRINT_AREA_PADDING_CM * 2;
    const heightPx = labelRef.current?.getBoundingClientRect().height ?? 0;
    // El tamaño de página de impresión siempre respeta el alto fijo que se
    // configuró (nunca se agranda solo): casi siempre corresponde a una
    // hoja de etiquetas física de tamaño exacto. Si el contenido no cabe
    // (heightOverflow), el navegador simplemente sigue imprimiendo el
    // sobrante en páginas adicionales del mismo tamaño, en vez de perderlo
    // o de imprimir una página más grande de lo que pediste.
    const contentHeightCm = product.labelHeightCm || pxToCm(heightPx);
    const heightCm = contentHeightCm + PRINT_AREA_PADDING_CM * 2;

    let styleEl = document.getElementById(SINGLE_PRINT_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = SINGLE_PRINT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@media print { @page { size: ${widthCm.toFixed(2)}cm ${heightCm.toFixed(2)}cm; margin: 0; } }`;

    function cleanup() {
      styleEl?.remove();
      window.removeEventListener('afterprint', cleanup);
    }
    window.addEventListener('afterprint', cleanup);

    window.print();
  }

  return (
    <div className="product-editor">
      <div className="editor-toolbar no-print">
        <button className="link-btn" onClick={onBack}>
          ← Volver a mis productos
        </button>
        <div className="spacer" />
        <button onClick={exportPng}>Exportar como imagen (PNG)</button>
        <button className="primary-btn" onClick={printLabel}>
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="editor-columns">
        <div className="editor-form-col no-print">
          <ProductForm product={product} dictionary={dictionary} onChange={onChange} />
        </div>
        <div className="editor-preview-col">
          <div className="preview-sticky">
            <p className="hint no-print">
              Vista previa de la etiqueta en español. Los sellos de advertencia son una
              <strong> estimación</strong> basada en la NOM-051 — verifica con tu proveedor de
              etiquetado antes de imprimir en producción.
            </p>
            {heightOverflow && (
              <div className="warning-banner no-print">
                <strong>⚠ Hay muchísimo contenido para el alto fijo que pusiste</strong> — la
                letra ya se encogió al máximo posible y aun así no alcanza (esto pasa con
                cantidades de contenido extremas, no en el uso normal). El tamaño de la etiqueta
                se respeta tal cual lo indicaste; lo que sobra se ve desbordado abajo solo para
                que no se pierda información sin que te enteres. Para que quepa de verdad, quita
                alguna sección opcional, activa varias columnas, o usa un ancho o alto mayor.
              </div>
            )}
            {columnSuggestion !== null && (
              <div className="hint no-print">
                ℹ Se usaron {columnSuggestion} columna{columnSuggestion === 1 ? '' : 's'} en vez de
                las {product.columnCount} que pediste — uno de los bloques (seguro la tabla
                nutrimental o ingredientes activos, que no se pueden partir) ya era tan alto por sí
                solo que ninguna forma de acomodar el resto iba a llenar las demás columnas parejo,
                así que se ajustó solo para no dejar espacio en blanco tirado.
              </div>
            )}
            <div className="print-area">
              <NutritionLabel
                product={product}
                ref={labelRef}
                onOverflowChange={setHeightOverflow}
                onColumnSuggestion={setColumnSuggestion}
                onScaleChange={setContentScale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
