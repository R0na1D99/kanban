export interface Column {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  position: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnPayload {
  title: string;
}

export interface UpdateColumnPayload {
  title: string;
}

export interface CreateCardPayload {
  title: string;
  description?: string;
}

export interface UpdateCardPayload {
  title?: string;
  description?: string;
}

export interface ReorderCardsPayload {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  position: number;
}

export interface ReorderColumnsPayload {
  orderedIds: string[];
}
