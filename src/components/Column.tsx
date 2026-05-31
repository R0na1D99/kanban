import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../types';
import Card from './Card';
import CardModal from './CardModal';

interface ColumnProps {
  column: { id: string; title: string };
  cards: CardType[];
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddCard: (title: string, description?: string) => void;
  onToggleCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onEditCard: (cardId: string, title: string, description: string) => void;
}

export default function Column({
  column,
  cards,
  onRename,
  onDelete,
  onAddCard,
  onToggleCard,
  onDeleteCard,
  onEditCard,
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${column.id}`,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isAdding && cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, [isAdding]);

  const handleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
    setEditTitle(column.title);
  };

  const handleAddCard = () => {
    const trimmed = newCardTitle.trim();
    if (trimmed) {
      onAddCard(trimmed);
      setNewCardTitle('');
      setIsAdding(false);
    }
  };

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={`column ${isOver ? 'column--over' : ''}`}
    >
      <div className="column__header" {...attributes} {...listeners}>
        {isEditing ? (
          <input
            ref={titleInputRef}
            className="column__title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditTitle(column.title);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="column__title" onDoubleClick={() => setIsEditing(true)}>
            {column.title}
          </h3>
        )}
        <div className="column__actions">
          <button
            className="column__action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditTitle(column.title);
            }}
            title="Rename column"
          >
            ✎
          </button>
          <button
            className="column__action-btn column__action-btn--danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete column"
          >
            ×
          </button>
        </div>
      </div>

      <SortableContext items={sortedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="column__cards">
          {sortedCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              columnId={column.id}
              onToggle={() => onToggleCard(card.id)}
              onDelete={() => onDeleteCard(card.id)}
              onClick={() => setEditingCard(card)}
            />
          ))}
          {sortedCards.length === 0 && (
            <div className="column__empty">Drop cards here</div>
          )}
        </div>
      </SortableContext>

      <div className="column__footer">
        {isAdding ? (
          <div className="column__add-form">
            <input
              ref={cardInputRef}
              className="column__add-input"
              placeholder="Card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onBlur={() => {
                if (!newCardTitle.trim()) setIsAdding(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCardTitle('');
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="column__add-actions">
              <button className="btn btn--primary btn--sm" onMouseDown={handleAddCard}>
                Add
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onMouseDown={() => {
                  setIsAdding(false);
                  setNewCardTitle('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="column__add-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
          >
            + Add Card
          </button>
        )}
      </div>

      {editingCard && (
        <CardModal
          card={editingCard}
          onSave={(title, description) => {
            onEditCard(editingCard.id, title, description);
            setEditingCard(null);
          }}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}
