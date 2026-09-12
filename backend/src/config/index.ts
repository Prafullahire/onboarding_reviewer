import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'onboarding',
    password: process.env.DB_PASSWORD ?? 'onboarding_pass',
    database: process.env.DB_NAME ?? 'onboarding_reviewer',
  },
  agent: {
    maxRetries: parseInt(process.env.AGENT_MAX_RETRIES ?? '2', 10),
    timeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS ?? '30000', 10),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
};
