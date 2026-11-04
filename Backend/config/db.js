import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongoUri, { dbName: env.dbName });
  console.log('[db] MongoDB connected');
  return mongoose.connection;
};

