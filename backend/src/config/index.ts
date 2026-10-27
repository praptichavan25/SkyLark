import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from workspace root or backend root (does nothing on Render where vars are injected)
const rootEnv = path.resolve(process.cwd(), '.env');
const backendEnv = path.resolve(__dirname, '../../.env');
const localEnv = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv, override: false });
} else if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv, override: false });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv, override: false });
}

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// Find the frontend/dist directory across different execution contexts:
// 1. Explicit env var FRONTEND_DIST_PATH
// 2. Relative to repository root when cwd is repo root: ./frontend/dist
// 3. Relative to repository root when cwd is backend: ../frontend/dist
// 4. Relative to compiled backend file (__dirname/../../../frontend/dist)
function resolveFrontendDist(): string {
  if (process.env.FRONTEND_DIST_PATH) {
    return path.resolve(process.env.FRONTEND_DIST_PATH);
  }

  const candidates = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Default fallback if not yet built
  return path.resolve(__dirname, '../../../frontend/dist');
}

export const config = {
  port: parseInt(process.env.PORT || '5005', 10),

  // In production (Render), bind to 0.0.0.0 so the platform can route traffic.
  // In local dev, bind to 127.0.0.1 for security.
  host: process.env.HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'),

  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS origin — only needed when frontend and backend are on different origins.
  // Not required for same-origin production deployment.
  corsOrigin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',

  aviationstackApiKey: process.env.AVIATIONSTACK_API_KEY || '',
  aviationstackBaseUrl: process.env.AVIATIONSTACK_BASE_URL || 'https://api.aviationstack.com',

  // Absolute path to the built frontend dist directory.
  frontendDistPath: resolveFrontendDist(),
};
