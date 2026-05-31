import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();

interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  position: number;
  completed: number;
  createdAt: string;
  updatedAt: string;
}

router.get('/columns/:columnId/cards', (req: Request, res: Response) => {
  const db = getDb();
  const { columnId } = req.params;

  const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(columnId);
  if (!column) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  const cards = db.prepare('SELECT * FROM cards WHERE columnId = ? ORDER BY position ASC').all(columnId) as Card[];
  res.json({ cards });
});

router.post('/columns/:columnId/cards', (req: Request, res: Response) => {
  const db = getDb();
  const { columnId } = req.params;
  const { title, description } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(columnId);
  if (!column) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM cards WHERE columnId = ?').get(columnId) as { maxPos: number };
  const now = new Date().toISOString();
  const card: Card = {
    id: uuidv4(),
    title,
    description: description || '',
    columnId,
    position: maxPos.maxPos + 1,
    completed: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    'INSERT INTO cards (id, title, description, columnId, position, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(card.id, card.title, card.description, card.columnId, card.position, card.completed, card.createdAt, card.updatedAt);

  res.status(201).json({ card });
});

router.put('/cards/reorder', (req: Request, res: Response) => {
  const db = getDb();
  const { cardId, fromColumnId, toColumnId, position } = req.body;

  if (!cardId || !fromColumnId || !toColumnId || position === undefined) {
    res.status(400).json({ error: 'cardId, fromColumnId, toColumnId, and position are required' });
    return;
  }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as Card | undefined;
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  const now = new Date().toISOString();
  const shiftDownStmt = db.prepare('UPDATE cards SET position = position + 1, updatedAt = ? WHERE columnId = ? AND position >= ?');
  const shiftUpStmt = db.prepare('UPDATE cards SET position = position - 1, updatedAt = ? WHERE columnId = ? AND position > ?');
  const updateCardStmt = db.prepare('UPDATE cards SET columnId = ?, position = ?, updatedAt = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    shiftUpStmt.run(now, card.columnId, card.position);

    let adjustedPosition = position;
    if (fromColumnId === toColumnId && position > card.position) {
      adjustedPosition -= 1;
    }

    shiftDownStmt.run(now, toColumnId, adjustedPosition);
    updateCardStmt.run(toColumnId, adjustedPosition, now, cardId);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as Card;
  res.json({ card: updated });
});

router.put('/cards/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { title, description } = req.body;

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card | undefined;
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  const now = new Date().toISOString();
  const newTitle = title !== undefined ? title : card.title;
  const newDescription = description !== undefined ? description : card.description;

  db.prepare('UPDATE cards SET title = ?, description = ?, updatedAt = ? WHERE id = ?').run(newTitle, newDescription, now, id);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card;
  res.json({ card: updated });
});

router.patch('/cards/:id/toggle', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card | undefined;
  if (!card) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  const now = new Date().toISOString();
  const newCompleted = card.completed === 0 ? 1 : 0;

  db.prepare('UPDATE cards SET completed = ?, updatedAt = ? WHERE id = ?').run(newCompleted, now, id);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card;
  res.json({ card: updated });
});

router.delete('/cards/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const result = db.prepare('DELETE FROM cards WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Card not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
