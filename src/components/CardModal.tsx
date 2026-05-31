import type { Card as CardType } from '../types';

interface CardModalProps {
  card: CardType;
  onSave: (title: string, description: string) => void;
  onClose: () => void;
}

import { useState, useRef, useEffect } from 'react';

export default function CardModal({ card, onSave, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed) {
      onSave(trimmed, description.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Edit Card</h3>
        <div className="modal__body">
          <label className="modal__label">Title</label>
          <input
            ref={titleRef}
            className="modal__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
          <label className="modal__label">Description</label>
          <textarea
            className="modal__textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add a description..."
          />
        </div>
        <div className="modal__actions">
          <button className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
