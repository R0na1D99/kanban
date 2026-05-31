import { useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useBoard } from '../hooks/useBoard';
import Column from './Column';
import AddColumn from './AddColumn';

export default function Board() {
  const {
    columns,
    cardsByColumn,
    loading,
    error,
    loadBoard,
    addColumn,
    renameColumn,
    removeColumn,
    reorderColumnList,
    addCard,
    editCard,
    removeCard,
    toggleCardComplete,
    moveCard,
  } = useBoard();

  // Drag state tracked by DndContext internals and data attributes

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // no-op: drag identity is encoded in active.data
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback is handled by droppable isOver state
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // --- Column reorder ---
      if (activeData?.type === 'column' && overData?.type === 'column') {
        if (active.id !== over.id) {
          const oldIdx = columns.findIndex((c) => c.id === active.id);
          const newIdx = columns.findIndex((c) => c.id === over.id);
          if (oldIdx !== -1 && newIdx !== -1) {
            const reordered = arrayMove(columns, oldIdx, newIdx);
            const orderedIds = reordered.map((c) => c.id);
            await reorderColumnList(orderedIds);
          }
        }
        return;
      }

      // --- Card move ---
      if (activeData?.type === 'card') {
        const fromColumnId = activeData.columnId as string;

        let toColumnId: string;
        let newPosition: number;

        if (overData?.type === 'card') {
          toColumnId = overData.columnId as string;
          // Determine position: insert before the target card
          const targetColCards = cardsByColumn[toColumnId] || [];
          const overIdx = targetColCards.findIndex((c) => c.id === over.id);
          newPosition = overIdx >= 0 ? overIdx : targetColCards.length;

          // If moving within same column and active is before over, adjust
          if (fromColumnId === toColumnId) {
            const activeIdx = targetColCards.findIndex((c) => c.id === active.id);
            if (activeIdx < overIdx) {
              newPosition = overIdx; // already correct, server will reindex
            }
          }
        } else if (overData?.type === 'column') {
          toColumnId = overData.column.id as string;
          const targetColCards = cardsByColumn[toColumnId] || [];
          // Remove active card from target count if same column
          const count = fromColumnId === toColumnId
            ? targetColCards.length - 1
            : targetColCards.length;
          newPosition = count;
        } else {
          return; // dropped on unknown target
        }

        // Only move if actually changing position/column
        const sourceCards = cardsByColumn[fromColumnId] || [];
        const activeIdx = sourceCards.findIndex((c) => c.id === active.id);
        const sameColumn = fromColumnId === toColumnId;
        const samePosition = sameColumn && activeIdx === newPosition;

        if (!sameColumn || !samePosition) {
          await moveCard(active.id as string, fromColumnId, toColumnId, newPosition);
        }
      }
    },
    [columns, cardsByColumn, reorderColumnList, moveCard]
  );

  if (loading) {
    return (
      <div className="board__status">
        <div className="spinner" />
        <p>Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board__status board__status--error">
        <p>{error}</p>
        <button className="btn btn--primary" onClick={loadBoard}>
          Retry
        </button>
      </div>
    );
  }

  const columnIds = columns.map((c) => c.id);

  return (
    <div className="board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div className="board__columns">
            {columns.map((col) => (
              <Column
                key={col.id}
                column={col}
                cards={cardsByColumn[col.id] || []}
                onRename={(title) => renameColumn(col.id, title)}
                onDelete={() => removeColumn(col.id)}
                onAddCard={(title, description) => addCard(col.id, title, description)}
                onToggleCard={(cardId) => toggleCardComplete(cardId, col.id)}
                onDeleteCard={(cardId) => removeCard(cardId, col.id)}
                onEditCard={(cardId, title, description) =>
                  editCard(cardId, col.id, { title, description })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddColumn onAdd={addColumn} />
    </div>
  );
}
