import { CATEGORIES } from '../data/categories';
import { Category } from '../types';

interface Props {
  onSelect: (category: Category) => void;
  onClose: () => void;
}

export default function CategoryPicker({ onSelect, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>¿Qué tipo de suplemento vas a reetiquetar?</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="category-card" onClick={() => onSelect(c.id)}>
              <strong>{c.label}</strong>
              <span>{c.description}</span>
            </button>
          ))}
        </div>
        <button className="link-btn" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
