// Admin-only CLI setup: node scripts/createPA.js <name> <username> <password>
// Requires server-side access (env credentials); not exposed over HTTP.
import mongoose from 'mongoose';
import { assertEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import PA from '../models/PA.js';

const [name, username, password] = process.argv.slice(2);
if (!name || !username || !password || password.length < 8) {
  console.error('Usage: node scripts/createPA.js <name> <username> <password (min 8 chars)>');
  process.exit(1);
}

try {
  assertEnv();
  await connectDB();
  const pa = await PA.create({ name, username, password });
  console.log(`PA created: ${pa.username} (${pa._id})`);
} catch (e) {
  console.error(e.code === 11000 ? 'Username already exists' : e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

