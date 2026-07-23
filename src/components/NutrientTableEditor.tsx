import { Nutrient, NutrientUnit } from '../types';
import { newId } from '../utils/id';

interface Props {
  nutrients: Nutrient[];
  onChange: (nutrients: Nutrient[]) => void;
}

const UNITS: NutrientUnit[] = ['g', 'mg', 'mcg', 'kcal', 'kJ'];

export default function NutrientTableEditor({ nutrients, onChange }: Props) {
  function update(id: string, patch: Partial<Nutrient>) {
    onChange(nutrients.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }

  function remove(id: string) {
    onChange(nutrients.filter((n) => n.id !== id));
  }

  function addRow() {
    onChange([
      ...nutrients,
      { id: newId('nut'), labelEn: '', labelEs: '', unit: 'mg', amount: '', dailyValuePercent: '' },
    ]);
  }

  return (
    <div className="nutrient-editor">
      <table>
        <thead>
          <tr>
            <th>Nombre en inglés (original)</th>
            <th>Nombre en español (etiqueta nueva)</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>% VD (opcional)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {nutrients.map((n) => (
            <tr key={n.id} className={n.indent ? 'indent' : ''}>
              <td>
                <input value={n.labelEn} onChange={(e) => update(n.id, { labelEn: e.target.value })} />
              </td>
              <td>
                <input value={n.labelEs} onChange={(e) => update(n.id, { labelEs: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  value={n.amount}
                  onChange={(e) => update(n.id, { amount: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </td>
              <td>
                <select value={n.unit} onChange={(e) => update(n.id, { unit: e.target.value as NutrientUnit })}>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={n.dailyValuePercent ?? ''}
                  onChange={(e) =>
                    update(n.id, { dailyValuePercent: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                />
              </td>
              <td>
                {!n.locked && (
                  <button className="danger small" onClick={() => remove(n.id)}>
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="link-btn" onClick={addRow}>
        + Agregar nutrimento (vitamina, mineral, etc.)
      </button>
    </div>
  );
}
