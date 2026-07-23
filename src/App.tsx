import { useMemo, useState } from 'react';
import { Product, Category, DictionaryEntry } from './types';
import { createBlankProduct, normalizeProduct } from './data/categories';
import { useLocalStorage } from './hooks/useLocalStorage';
import ProductList from './components/ProductList';
import CategoryPicker from './components/CategoryPicker';
import ProductEditor from './components/ProductEditor';
import DictionaryBrowser from './components/DictionaryBrowser';
import PrintSheetView from './components/PrintSheetView';
import { newId } from './utils/id';

type View = 'list' | 'editor' | 'dictionary' | 'sheet';

export default function App() {
  const [rawProducts, setProducts] = useLocalStorage<Product[]>('reetiquetado_products', []);
  const products = useMemo(() => rawProducts.map(normalizeProduct), [rawProducts]);
  const [customDictionary, setCustomDictionary] = useLocalStorage<DictionaryEntry[]>(
    'reetiquetado_dictionary_custom',
    [],
  );
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  function handleCreate(category: Category) {
    const product = createBlankProduct(category);
    setProducts((prev) => [product, ...prev]);
    setSelectedId(product.id);
    setShowPicker(false);
    setView('editor');
  }

  function handleUpdate(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...updated, updatedAt: Date.now() } : p)));
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setView('list');
    }
  }

  function handleDuplicate(id: string) {
    const original = products.find((p) => p.id === id);
    if (!original) return;
    const now = Date.now();
    const copy: Product = {
      ...original,
      id: newId('prod'),
      productNameEs: original.productNameEs ? `${original.productNameEs} (copia)` : '',
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [copy, ...prev]);
  }

  function handleImport(imported: Product[]) {
    setProducts((prev) => [...imported, ...prev]);
  }

  function addCustomDictionaryEntry(entry: DictionaryEntry) {
    setCustomDictionary((prev) => [entry, ...prev]);
  }

  function removeCustomDictionaryEntry(index: number) {
    setCustomDictionary((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <h1>Reetiquetado de Suplementos</h1>
        <nav className="app-nav">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            Mis productos
          </button>
          <button className={view === 'sheet' ? 'active' : ''} onClick={() => setView('sheet')}>
            Imprimir hoja
          </button>
          <button className={view === 'dictionary' ? 'active' : ''} onClick={() => setView('dictionary')}>
            Diccionario
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'list' && (
          <ProductList
            products={products}
            onOpen={(id) => {
              setSelectedId(id);
              setView('editor');
            }}
            onNew={() => setShowPicker(true)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onImport={handleImport}
          />
        )}

        {view === 'editor' && selectedProduct && (
          <ProductEditor
            product={selectedProduct}
            customDictionary={customDictionary}
            onChange={handleUpdate}
            onBack={() => setView('list')}
            onAddDictionaryEntry={addCustomDictionaryEntry}
          />
        )}

        {view === 'sheet' && <PrintSheetView products={products} />}

        {view === 'dictionary' && (
          <DictionaryBrowser
            customEntries={customDictionary}
            onAdd={addCustomDictionaryEntry}
            onRemove={removeCustomDictionaryEntry}
          />
        )}
      </main>

      {showPicker && (
        <CategoryPicker onSelect={handleCreate} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
