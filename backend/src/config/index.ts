import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1. Detect environment
const isRender = Boolean(process.env.RENDER);
const explicitEnv = process.env.NODE_ENV;

// Only load local .env files in local development — never in Render or production
if (!isRender && explicitEnv !== 'production') {
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
}

// 2. Determine environment mode
// When running compiled JavaScript or on Render, default to 'production' if not explicitly set
const isCompiled = !__filename.endsWith('.ts');
const nodeEnv = process.env.NODE_ENV || (isRender || isCompiled ? 'production' : 'development');
const isProduction = nodeEnv === 'production';

// 3. Port resolution: Use process.env.PORT provided by Render, fallback to 5005 locally
const rawPort = process.env.PORT;
const port = rawPort ? parseInt(rawPort, 10) : 5005;

// 4. Host resolution: In production (Render), ALWAYS bind to 0.0.0.0.
// Avoid binding specifically to 127.0.0.1 or localhost in production.
function resolveHost(): string {
  if (isProduction || isRender) {
    return '0.0.0.0';
  }
  // If explicitly overridden via HOST env var in development, use it; otherwise 0.0.0.0
  return process.env.HOST || '0.0.0.0';
}

const host = resolveHost();

// 5. Find the frontend/dist directory across different execution contexts:
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

  // Default fallback
  return path.resolve(__dirname, '../../../frontend/dist');
}

export const config = {
  port,
  host,
  nodeEnv,
  isProduction,

  // CORS origin — only needed when frontend and backend are on different origins.
  // Not required for same-origin production deployment.
  corsOrigin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',

  aviationstackApiKey: process.env.AVIATIONSTACK_API_KEY || '',
  aviationstackBaseUrl: process.env.AVIATIONSTACK_BASE_URL || 'https://api.aviationstack.com',

  // Absolute path to the built frontend dist directory.
  frontendDistPath: resolveFrontendDist(),
};
