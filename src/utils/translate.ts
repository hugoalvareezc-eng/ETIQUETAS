import { DictionaryEntry } from '../types';

export function lookupTranslation(en: string, dictionary: DictionaryEntry[]): string | null {
  const needle = en.trim().toLowerCase();
  if (!needle) return null;
  const exact = dictionary.find((d) => d.en.toLowerCase() === needle);
  if (exact) return exact.es;
  const partial = dictionary.find(
    (d) => d.en.toLowerCase().includes(needle) || needle.includes(d.en.toLowerCase()),
  );
  return partial ? partial.es : null;
}

export function searchDictionary(query: string, dictionary: DictionaryEntry[], limit = 8): DictionaryEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return dictionary
    .filter((d) => d.en.toLowerCase().includes(needle) || d.es.toLowerCase().includes(needle))
    .slice(0, limit);
}

// Reemplaza frases/términos en inglés reconocidos por su equivalente en
// español dentro de un bloque de texto (por ejemplo, la lista de
// ingredientes). Es un punto de partida rápido: el usuario debe revisar el
// resultado, ya que el reemplazo es literal y no entiende gramática.
export function translateBlock(text: string, dictionary: DictionaryEntry[]): string {
  if (!text.trim()) return text;
  const sorted = [...dictionary].sort((a, b) => b.en.length - a.en.length);
  let result = text;
  for (const entry of sorted) {
    if (!entry.en) continue;
    const escaped = entry.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(re, entry.es);
  }
  return result;
}
