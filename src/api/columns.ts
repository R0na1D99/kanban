import apiClient from './client';
import type { Column, CreateColumnPayload, UpdateColumnPayload } from '../types';

export async function fetchColumns(): Promise<Column[]> {
  const { data } = await apiClient.get<{ columns: Column[] }>('/columns');
  return data.columns;
}

export async function createColumn(payload: CreateColumnPayload): Promise<Column> {
  const { data } = await apiClient.post<{ column: Column }>('/columns', payload);
  return data.column;
}

export async function updateColumn(id: string, payload: UpdateColumnPayload): Promise<Column> {
  const { data } = await apiClient.put<{ column: Column }>(`/columns/${id}`, payload);
  return data.column;
}

export async function deleteColumn(id: string): Promise<void> {
  await apiClient.delete(`/columns/${id}`);
}

export async function reorderColumns(orderedIds: string[]): Promise<Column[]> {
  const { data } = await apiClient.put<{ columns: Column[] }>('/columns/reorder', { orderedIds });
  return data.columns;
}
