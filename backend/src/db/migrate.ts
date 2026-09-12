import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config } from '../config/index.js';
import { getPool } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDatabase(): Promise<void> {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`Database '${config.db.database}' is ready.`);
  await connection.end();
}

async function migrate(): Promise<void> {
  await ensureDatabase();

  const pool = getPool();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

  const statements = [...schema.split(';'), ...seed.split(';')]
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log('Migration completed successfully.');
  console.log('Tables created: onboarding_cases, review_workflows, audit_log');
  console.log('Sample data: 3 onboarding cases loaded.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
