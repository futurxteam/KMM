import env, { assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const start = async () => {
  assertEnv();
  await connectDB();
  app.listen(env.port, () => console.log(`[server] listening on port ${env.port}`));
};

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});

