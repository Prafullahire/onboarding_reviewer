import app from './app.js';
import { config } from './config/index.js';
import { testConnection } from './db/connection.js';

async function main(): Promise<void> {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn(
      'Warning: Could not connect to MySQL. Ensure Docker is running: docker compose up -d'
    );
  } else {
    console.log('Connected to MySQL database.');
  }

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
