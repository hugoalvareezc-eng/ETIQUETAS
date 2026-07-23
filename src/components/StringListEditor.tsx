interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
}

export default function StringListEditor({ items, onChange, addLabel = '+ Agregar' }: Props) {
  function update(index: number, value: string) {
    onChange(items.map((it, i) => (i === index ? value : it)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, '']);
  }

  return (
    <div className="string-list-editor">
      {items.map((item, i) => (
        <div key={i} className="string-list-row">
          <textarea value={item} onChange={(e) => update(i, e.target.value)} rows={2} />
          <button className="danger small" onClick={() => remove(i)}>
            ×
          </button>
        </div>
      ))}
      <button className="link-btn" onClick={add}>
        {addLabel}
      </button>
    </div>
  );
}
