import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';

const router = Router();

interface Column {
  id: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all() as Column[];
  res.json({ columns });
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as maxPos FROM columns').get() as { maxPos: number };
  const now = new Date().toISOString();
  const column: Column = {
    id: uuidv4(),
    title,
    position: maxPos.maxPos + 1,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare('INSERT INTO columns (id, title, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
    column.id, column.title, column.position, column.createdAt, column.updatedAt
  );

  res.status(201).json({ column });
});

router.put('/reorder', (req: Request, res: Response) => {
  const db = getDb();
  const { orderedIds } = req.body;

  if (!orderedIds || !Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'orderedIds is required and must be an array' });
    return;
  }

  const now = new Date().toISOString();
  const updateStmt = db.prepare('UPDATE columns SET position = ?, updatedAt = ? WHERE id = ?');

  const transaction = db.transaction(() => {
    for (let i = 0; i < orderedIds.length; i++) {
      updateStmt.run(i, now, orderedIds[i]);
    }
  });

  transaction();

  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all() as Column[];
  res.json({ columns });
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  const now = new Date().toISOString();
  const result = db.prepare('UPDATE columns SET title = ?, updatedAt = ? WHERE id = ?').run(title, now, id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(id) as Column;
  res.json({ column });
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;

  const result = db.prepare('DELETE FROM columns WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Column not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
