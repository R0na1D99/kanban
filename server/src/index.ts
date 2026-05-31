import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import columnsRouter from './routes/columns';
import cardsRouter from './routes/cards';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/columns', columnsRouter);
app.use('/api', cardsRouter);

initDb();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
