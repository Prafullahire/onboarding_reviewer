import express from 'express';
import cors from 'cors';
import casesRouter from './routes/cases.js';
import reviewsRouter from './routes/reviews.js';
import agentsRouter from './routes/agents.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/cases', casesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/agents', agentsRouter);

export default app;
