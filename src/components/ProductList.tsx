import { Product } from '../types';
import { categoryLabel } from '../data/categories';

interface Props {
  products: Product[];
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export default function ProductList({ products, onOpen, onNew, onDelete, onDuplicate }: Props) {
  const sorted = [...products].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="product-list">
      <div className="product-list-toolbar">
        <button className="primary-btn" onClick={onNew}>
          + Nuevo producto
        </button>
      </div>

      {sorted.length === 0 && (
        <p className="empty-state">
          Todavía no has creado ningún producto. Pulsa "Nuevo producto" y elige una plantilla
          (proteína, pre-entreno, creatina, aminoácidos, vitaminas u otro) para empezar.
        </p>
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
