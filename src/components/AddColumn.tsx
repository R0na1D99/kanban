import { useState, useRef, useEffect } from 'react';

interface AddColumnProps {
  onAdd: (title: string) => Promise<unknown>;
}

export default function AddColumn({ onAdd }: AddColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (trimmed) {
      await onAdd(trimmed);
      setTitle('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="add-column add-column--editing">
        <input
          ref={inputRef}
          className="add-column__input"
          placeholder="Column name..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') {
              setIsAdding(false);
              setTitle('');
            }
          }}
        />
        <div className="add-column__actions">
          <button className="btn btn--primary btn--sm" onClick={handleAdd}>
            Add
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setIsAdding(false);
              setTitle('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className="add-column"
      onClick={() => setIsAdding(true)}
    >
      + Add Column
    </button>
  );
}
