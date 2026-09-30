import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env in current working directory and root
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

export let loadedEnvPath: string | null = null;
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false });
    if (!loadedEnvPath) loadedEnvPath = p;
  }
}

const rootEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
  loadedEnvPath = rootEnvPath;
}

const port = parseInt(process.env.PORT || '5000', 10);

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: port,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/libr_saas',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_libr_saas_default_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SUPERADMIN_EMAIL: (process.env.SUPERADMIN_EMAIL || 'owner@example.com').toLowerCase().trim(),
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD || 'ChangeThisImmediately',
  SUPERADMIN_NAME: process.env.SUPERADMIN_NAME || 'Platform Owner',
};
