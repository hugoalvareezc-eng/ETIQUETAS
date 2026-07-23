import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { DictionaryEntry, Product } from '../types';
import ProductForm from './ProductForm';
import NutritionLabel from './NutritionLabel';
import { BASE_DICTIONARY } from '../data/dictionary';

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

  async function exportPng() {
    if (!labelRef.current) return;
    const dataUrl = await toPng(labelRef.current, { pixelRatio: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    const name = (product.productNameEs || product.productNameEn || 'etiqueta').replace(/\s+/g, '_');
    link.download = `${name}.png`;
    link.href = dataUrl;
    link.click();
  }

  function printLabel() {
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
                <strong>⚠ El contenido no cabe en el alto fijo que pusiste</strong>, aunque ya se
                encogió la letra al mínimo legible. Prueba agrandando el alto, quitando alguna
                sección opcional, o dejando el alto en automático.
              </div>
            )}
            <div className="print-area">
              <NutritionLabel product={product} ref={labelRef} onOverflowChange={setHeightOverflow} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
