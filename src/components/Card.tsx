import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  columnId: string;
  onToggle: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function Card({ card, columnId, onToggle, onDelete, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card, columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card ${card.completed ? 'card--completed' : ''}`}
    >
      <div className="card__content" onClick={onClick}>
        <div className="card__header">
          <button
            className={`card__toggle ${card.completed ? 'card__toggle--done' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title={card.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {card.completed ? '✓' : '○'}
          </button>
          <span className={`card__title ${card.completed ? 'card__title--completed' : ''}`}>
            {card.title}
          </span>
        </div>
        {card.description && (
          <p className="card__description">{card.description}</p>
        )}
      </div>
      <button
        className="card__delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete card"
      >
        ×
      </button>
    </div>
  );
}
