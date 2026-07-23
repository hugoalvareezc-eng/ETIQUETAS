import { ActiveIngredient, DictionaryEntry } from '../types';
import { newId } from '../utils/id';
import { lookupTranslation } from '../utils/translate';

interface Props {
  ingredients: ActiveIngredient[];
  dictionary: DictionaryEntry[];
  onChange: (ingredients: ActiveIngredient[]) => void;
}

export default function ActiveIngredientsEditor({ ingredients, dictionary, onChange }: Props) {
  function update(id: string, patch: Partial<ActiveIngredient>) {
    onChange(ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function remove(id: string) {
    onChange(ingredients.filter((i) => i.id !== id));
  }

  function addRow() {
    onChange([...ingredients, { id: newId('ai'), nameEn: '', nameEs: '', amount: '', unit: 'mg' }]);
  }

  function autoTranslate(id: string, nameEn: string) {
    const found = lookupTranslation(nameEn, dictionary);
    if (found) update(id, { nameEs: found });
  }

  return (
    <div className="nutrient-editor">
      <table>
        <thead>
          <tr>
            <th>Ingrediente activo (inglés)</th>
            <th>Ingrediente activo (español)</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => (
            <tr key={i.id}>
              <td>
                <input
                  value={i.nameEn}
                  onChange={(e) => update(i.id, { nameEn: e.target.value })}
                  onBlur={(e) => !i.nameEs && autoTranslate(i.id, e.target.value)}
                  placeholder="Caffeine Anhydrous"
                />
              </td>
              <td>
                <input
                  value={i.nameEs}
                  onChange={(e) => update(i.id, { nameEs: e.target.value })}
                  placeholder="Cafeína anhidra"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={i.amount}
                  onChange={(e) => update(i.id, { amount: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </td>
              <td>
                <input value={i.unit} onChange={(e) => update(i.id, { unit: e.target.value })} style={{ width: '4rem' }} />
              </td>
              <td>
                <button className="danger small" onClick={() => remove(i.id)}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="link-btn" onClick={addRow}>
        + Agregar ingrediente activo
      </button>
    </div>
  );
}
