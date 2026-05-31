import { useState, useEffect, useCallback } from 'react';
import type { Column, Card } from '../types';
import * as columnsApi from '../api/columns';
import * as cardsApi from '../api/cards';

export function useBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cols = await columnsApi.fetchColumns();
      setColumns(cols.sort((a, b) => a.position - b.position));

      const cardsMap: Record<string, Card[]> = {};
      for (const col of cols) {
        const cards = await cardsApi.fetchCards(col.id);
        cardsMap[col.id] = cards.sort((a, b) => a.position - b.position);
      }
      setCardsByColumn(cardsMap);
    } catch (err) {
      setError('Failed to load board. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // --- Column operations ---

  const addColumn = useCallback(async (title: string) => {
    const column = await columnsApi.createColumn({ title });
    setColumns(prev => [...prev, column]);
    setCardsByColumn(prev => ({ ...prev, [column.id]: [] }));
    return column;
  }, []);

  const renameColumn = useCallback(async (id: string, title: string) => {
    const updated = await columnsApi.updateColumn(id, { title });
    setColumns(prev => prev.map(c => (c.id === id ? updated : c)));
  }, []);

  const removeColumn = useCallback(async (id: string) => {
    await columnsApi.deleteColumn(id);
    setColumns(prev => prev.filter(c => c.id !== id));
    setCardsByColumn(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const reorderColumnList = useCallback(async (orderedIds: string[]) => {
    const updated = await columnsApi.reorderColumns(orderedIds);
    setColumns(updated.sort((a, b) => a.position - b.position));
  }, []);

  // --- Card operations ---

  const addCard = useCallback(async (columnId: string, title: string, description?: string) => {
    const card = await cardsApi.createCard(columnId, { title, description });
    setCardsByColumn(prev => ({
      ...prev,
      [columnId]: [...(prev[columnId] || []), card],
    }));
    return card;
  }, []);

  const editCard = useCallback(async (id: string, columnId: string, payload: { title?: string; description?: string }) => {
    const updated = await cardsApi.updateCard(id, payload);
    setCardsByColumn(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(c => (c.id === id ? updated : c)),
    }));
  }, []);

  const removeCard = useCallback(async (id: string, columnId: string) => {
    await cardsApi.deleteCard(id);
    setCardsByColumn(prev => ({
      ...prev,
      [columnId]: prev[columnId].filter(c => c.id !== id),
    }));
  }, []);

  const toggleCardComplete = useCallback(async (id: string, columnId: string) => {
    const updated = await cardsApi.toggleCard(id);
    setCardsByColumn(prev => ({
      ...prev,
      [columnId]: prev[columnId].map(c => (c.id === id ? updated : c)),
    }));
  }, []);

  const moveCard = useCallback(async (
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    position: number
  ) => {
    const movedCard = await cardsApi.reorderCards({
      cardId,
      fromColumnId,
      toColumnId,
      position,
    });

    setCardsByColumn(prev => {
      const next = { ...prev };

      // Remove from source
      next[fromColumnId] = (prev[fromColumnId] || []).filter(c => c.id !== cardId);

      // Reload both columns to get correct positions
      // We'll optimistically place it and rely on the server-corrected positions
      const targetCards = [...(prev[toColumnId] || [])];
      const existingIdx = targetCards.findIndex(c => c.id === cardId);
      if (existingIdx >= 0) targetCards.splice(existingIdx, 1);
      targetCards.splice(position, 0, movedCard);
      next[toColumnId] = targetCards;

      return next;
    });

    // Refresh card orders from server for both affected columns
    try {
      const [fromCards, toCards] = await Promise.all([
        cardsApi.fetchCards(fromColumnId),
        cardsApi.fetchCards(toColumnId),
      ]);
      setCardsByColumn(prev => ({
        ...prev,
        [fromColumnId]: fromCards.sort((a, b) => a.position - b.position),
        [toColumnId]: toCards.sort((a, b) => a.position - b.position),
      }));
    } catch {
      // Optimistic update already applied
    }
  }, []);

  return {
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
  };
}
