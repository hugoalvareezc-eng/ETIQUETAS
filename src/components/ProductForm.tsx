import { DictionaryEntry, Product, SectionKey } from '../types';
import NutrientTableEditor from './NutrientTableEditor';
import ActiveIngredientsEditor from './ActiveIngredientsEditor';
import StringListEditor from './StringListEditor';
import { lookupTranslation, translateBlock } from '../utils/translate';
import { getSections, SECTION_LABELS, SECTION_ORDER } from '../utils/sections';

interface Props {
  product: Product;
  dictionary: DictionaryEntry[];
  onChange: (product: Product) => void;
}

export default function ProductForm({ product, dictionary, onChange }: Props) {
  function patch(p: Partial<Product>) {
    onChange({ ...product, ...p });
  }

  const sections = getSections(product);

  function toggleSection(key: SectionKey, checked: boolean) {
    patch({ sections: { ...sections, [key]: checked } });
  }

  function translateName() {
    const found = lookupTranslation(product.productNameEn, dictionary);
    if (found) patch({ productNameEs: found });
  }

  function translateIngredientsList() {
    patch({ ingredientsListEs: translateBlock(product.ingredientsListEn, dictionary) });
  }

  return (
    <div className="product-form">
      <section>
        <h3>Datos generales</h3>
        <div className="form-grid">
          <label>
            Marca
            <input value={product.brand} onChange={(e) => patch({ brand: e.target.value })} />
          </label>
          <label>
            Nombre del producto (inglés, original)
            <input value={product.productNameEn} onChange={(e) => patch({ productNameEn: e.target.value })} />
          </label>
          <label>
            Nombre del producto (español, para la nueva etiqueta)
            <div className="input-with-button">
              <input value={product.productNameEs} onChange={(e) => patch({ productNameEs: e.target.value })} />
              <button type="button" onClick={translateName}>
                Traducir
              </button>
            </div>
          </label>
          <label>
            Denominación del producto (qué tipo de producto es, para el panel frontal)
            <input
              value={product.denominacionEs}
              onChange={(e) => patch({ denominacionEs: e.target.value })}
              placeholder="Ej. Proteína en polvo"
            />
          </label>
          <label>
            Sabor
            <input value={product.flavor} onChange={(e) => patch({ flavor: e.target.value })} />
          </label>
          <label>
            Contenido neto (ej. 900 g / 2 lb)
            <input value={product.netContent} onChange={(e) => patch({ netContent: e.target.value })} />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={product.isLiquid}
              onChange={(e) => patch({ isLiquid: e.target.checked })}
            />
            Es un producto líquido (bebida, shot, etc.)
          </label>
          <label>
            Ancho de la etiqueta (cm) — según el tamaño real del bote/bolsa
            <input
              type="number"
              step="0.5"
              min="2"
              value={product.labelWidthCm}
              onChange={(e) => patch({ labelWidthCm: e.target.value === '' ? 0 : Number(e.target.value) })}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={product.twoColumns}
              onChange={(e) => patch({ twoColumns: e.target.checked })}
            />
            Acomodar el contenido en 2 columnas (para etiquetas anchas con mucho texto)
          </label>
        </div>
      </section>

      <section>
        <h3>¿Qué incluir en la etiqueta?</h3>
        <p className="hint">
          Desmarca lo que no quieras que aparezca impreso (por ejemplo, los sellos de advertencia
          o el modo de uso). El dato sigue guardado en el formulario, solo se oculta de la
          etiqueta y se puede volver a activar cuando quieras.
        </p>
        <div className="section-toggle-bar">
          {SECTION_ORDER.map((key) => (
            <label key={key} className="checkbox-label section-toggle">
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={(e) => toggleSection(key, e.target.checked)}
              />
              {SECTION_LABELS[key]}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3>Porción</h3>
        <div className="form-grid">
          <label>
            Tamaño de la porción (texto, ej. "1 scoop (30 g)")
            <input value={product.servingSizeText} onChange={(e) => patch({ servingSizeText: e.target.value })} />
          </label>
          <label>
            Gramos (o ml) por porción (para calcular "por 100 g")
            <input
              type="number"
              value={product.servingSizeGrams}
              onChange={(e) => patch({ servingSizeGrams: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </label>
          <label>
            Porciones por envase
            <input
              type="number"
              value={product.servingsPerContainer}
              onChange={(e) =>
                patch({ servingsPerContainer: e.target.value === '' ? '' : Number(e.target.value) })
              }
            />
          </label>
        </div>
      </section>

      <section>
        <h3>Tabla nutrimental</h3>
        <p className="hint">
          Captura los valores de la etiqueta original (por porción). El sistema calcula
          automáticamente el valor "por 100 g" para la tabla y para estimar los sellos de
          advertencia.
        </p>
        <NutrientTableEditor nutrients={product.nutrients} onChange={(nutrients) => patch({ nutrients })} />
      </section>

      <section>
        <h3>Ingredientes activos / destacados</h3>
        <p className="hint">
          Ideal para pre-entrenos, creatinas y aminoácidos: cafeína, beta-alanina, creatina
          monohidratada, BCAA, etc.
        </p>
        <ActiveIngredientsEditor
          ingredients={product.activeIngredients}
          dictionary={dictionary}
          onChange={(activeIngredients) => patch({ activeIngredients })}
        />
      </section>

      <section>
        <h3>Cafeína y edulcorantes</h3>
        <div className="form-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={product.containsCaffeine}
              onChange={(e) => patch({ containsCaffeine: e.target.checked })}
            />
            Contiene cafeína
          </label>
          <label>
            Cafeína por porción (mg)
            <input
              type="number"
              value={product.caffeineMgPerServing}
              onChange={(e) =>
                patch({ caffeineMgPerServing: e.target.value === '' ? '' : Number(e.target.value) })
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={product.containsSweeteners}
              onChange={(e) => patch({ containsSweeteners: e.target.checked })}
            />
            Contiene edulcorantes no calóricos (sucralosa, stevia, ace-k, etc.)
          </label>
        </div>
      </section>

      <section>
        <h3>Lista de ingredientes</h3>
        <div className="two-col">
          <label>
            Lista original (inglés)
            <textarea
              rows={4}
              value={product.ingredientsListEn}
              onChange={(e) => patch({ ingredientsListEn: e.target.value })}
            />
          </label>
          <label>
            Lista en español
            <textarea
              rows={4}
              value={product.ingredientsListEs}
              onChange={(e) => patch({ ingredientsListEs: e.target.value })}
            />
          </label>
        </div>
        <button type="button" className="link-btn" onClick={translateIngredientsList}>
          Traducir automáticamente términos conocidos (revisa el resultado)
        </button>
      </section>

      <section>
        <h3>Modo de uso</h3>
        <textarea
          rows={3}
          value={product.directionsEs}
          onChange={(e) => patch({ directionsEs: e.target.value })}
        />
      </section>

      <section>
        <h3>Advertencias</h3>
        <StringListEditor
          items={product.warningsEs}
          onChange={(warningsEs) => patch({ warningsEs })}
          addLabel="+ Agregar advertencia"
        />
      </section>

      <section>
        <h3>Otros datos de la etiqueta</h3>
        <div className="form-grid">
          <label>
            Contiene alérgenos (ej. "Contiene leche y soya")
            <input value={product.allergenEs} onChange={(e) => patch({ allergenEs: e.target.value })} />
          </label>
          <label>
            Conservación
            <input value={product.storageEs} onChange={(e) => patch({ storageEs: e.target.value })} />
          </label>
          <label>
            Responsable / distribuido por (razón social, dirección)
            <input value={product.responsibleEs} onChange={(e) => patch({ responsibleEs: e.target.value })} />
          </label>
        </div>
      </section>
    </div>
  );
}
