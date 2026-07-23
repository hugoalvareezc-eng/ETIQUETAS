import { useMemo, useRef, useState } from 'react';
import { Category, Product } from '../types';
import { CATEGORIES, categoryLabel } from '../data/categories';
import { downloadProductsJson, parseProductsJson } from '../utils/exportImport';
import { filterProducts } from '../utils/filterProducts';

interface Props {
  products: Product[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onImport: (products: Product[]) => void;
}

export default function ProductList({ products, onOpen, onNew, onDelete, onDuplicate, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');

  const sorted = useMemo(() => {
    const filtered = filterProducts(products, query, category);
    return [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [products, query, category]);

  function handleExport() {
    downloadProductsJson(products);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseProductsJson(text);
      onImport(imported);
      window.alert(`Se importaron ${imported.length} producto(s).`);
    } catch (err) {
      window.alert(`No se pudo importar el archivo: ${(err as Error).message}`);
    }
  }

  return (
    <div className="product-list">
      <div className="product-list-toolbar">
        <button className="primary-btn" onClick={onNew}>
          + Nuevo producto
        </button>
        <button onClick={handleExport} disabled={products.length === 0}>
          Exportar catálogo (JSON)
        </button>
        <button onClick={handleImportClick}>Importar catálogo (JSON)</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
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
        </div>
      )}

      {products.length === 0 && (
        <p className="empty-state">
          Todavía no has creado ningún producto. Pulsa "Nuevo producto" y elige una plantilla
          (proteína, pre-entreno, creatina, aminoácidos, vitaminas u otro) para empezar, o
          "Importar catálogo" si ya tienes un archivo JSON con productos.
        </p>
      )}

      {products.length > 0 && sorted.length === 0 && (
        <p className="empty-state">No hay productos que coincidan con la búsqueda.</p>
      )}

      <div className="product-grid">
        {sorted.map((p) => (
          <div key={p.id} className="product-card">
            <div className="product-card-body" onClick={() => onOpen(p.id)}>
              <span className="badge">{categoryLabel(p.category)}</span>
              <h3>{p.productNameEs || p.productNameEn || 'Sin nombre'}</h3>
              <p className="muted">
                {p.brand} {p.flavor && `· ${p.flavor}`}
              </p>
            </div>
            <div className="product-card-actions">
              <button onClick={() => onOpen(p.id)}>Editar</button>
              <button onClick={() => onDuplicate(p.id)}>Duplicar</button>
              <button className="danger" onClick={() => onDelete(p.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
