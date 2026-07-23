import { useMemo, useState } from 'react';
import { DictionaryEntry } from '../types';
import { BASE_DICTIONARY } from '../data/dictionary';

interface Props {
  customEntries: DictionaryEntry[];
  onAdd: (entry: DictionaryEntry) => void;
  onRemove: (index: number) => void;
}

export default function DictionaryBrowser({ customEntries, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newEs, setNewEs] = useState('');
  const [newGroup, setNewGroup] = useState('Mis términos');

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = [...BASE_DICTIONARY];
    const filtered = needle
      ? all.filter((d) => d.en.toLowerCase().includes(needle) || d.es.toLowerCase().includes(needle))
      : all;
    const groups = new Map<string, DictionaryEntry[]>();
    for (const entry of filtered) {
      const list = groups.get(entry.group) ?? [];
      list.push(entry);
      groups.set(entry.group, list);
    }
    return groups;
  }, [query]);

  const filteredCustom = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customEntries
      .map((entry, index) => ({ entry, index }))
      .filter(
        ({ entry }) =>
          !needle || entry.en.toLowerCase().includes(needle) || entry.es.toLowerCase().includes(needle),
      );
  }, [customEntries, query]);

  function addEntry() {
    if (!newEn.trim() || !newEs.trim()) return;
    onAdd({ en: newEn.trim(), es: newEs.trim(), group: newGroup.trim() || 'Mis términos' });
    setNewEn('');
    setNewEs('');
  }

  return (
    <div className="dictionary-browser">
      <h2>Diccionario inglés → español</h2>
      <p className="hint">
        Términos comunes de etiquetas de suplementos. Se usan como sugerencias automáticas al
        capturar productos. Agrega tus propios términos si encuentras uno que falte.
      </p>

      <input
        className="search-input"
        placeholder="Buscar término (inglés o español)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="add-term-form">
        <input placeholder="Inglés" value={newEn} onChange={(e) => setNewEn(e.target.value)} />
        <input placeholder="Español" value={newEs} onChange={(e) => setNewEs(e.target.value)} />
        <input placeholder="Categoría" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
        <button onClick={addEntry}>+ Agregar término</button>
      </div>

      {filteredCustom.length > 0 && (
        <div className="dictionary-group">
          <h4>Mis términos personalizados</h4>
          <table>
            <tbody>
              {filteredCustom.map(({ entry, index }) => (
                <tr key={index}>
                  <td>{entry.en}</td>
                  <td>{entry.es}</td>
                  <td>
                    <button className="danger small" onClick={() => onRemove(index)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {[...grouped.entries()].map(([group, entries]) => (
        <div className="dictionary-group" key={group}>
          <h4>{group}</h4>
          <table>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.en}>
                  <td>{entry.en}</td>
                  <td>{entry.es}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
