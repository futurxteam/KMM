import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin) and whitelisted origins.
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '20kb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
