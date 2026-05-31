import apiClient from './client';
import type { Card, CreateCardPayload, UpdateCardPayload, ReorderCardsPayload } from '../types';

export async function fetchCards(columnId: string): Promise<Card[]> {
  const { data } = await apiClient.get<{ cards: Card[] }>(`/columns/${columnId}/cards`);
  return data.cards;
}

export async function createCard(columnId: string, payload: CreateCardPayload): Promise<Card> {
  const { data } = await apiClient.post<{ card: Card }>(`/columns/${columnId}/cards`, payload);
  return data.card;
}

export async function updateCard(id: string, payload: UpdateCardPayload): Promise<Card> {
  const { data } = await apiClient.put<{ card: Card }>(`/cards/${id}`, payload);
  return data.card;
}

export async function deleteCard(id: string): Promise<void> {
  await apiClient.delete(`/cards/${id}`);
}

export async function toggleCard(id: string): Promise<Card> {
  const { data } = await apiClient.patch<{ card: Card }>(`/cards/${id}/toggle`);
  return data.card;
}

export async function reorderCards(payload: ReorderCardsPayload): Promise<Card> {
  const { data } = await apiClient.put<{ card: Card }>('/cards/reorder', payload);
  return data.card;
}
