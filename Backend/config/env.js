import dotenv from 'dotenv';
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME || 'kmm_enquiry',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Used only by POST /api/auth/setup-admin (header x-setup-key). Never sent to the frontend.
  adminSetupKey: process.env.ADMIN_SETUP_KEY,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const assertEnv = () => {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (!env.adminSetupKey) {
    console.warn('[config] ADMIN_SETUP_KEY not set - initial admin setup endpoint is disabled.');
  }
};

export default env;
