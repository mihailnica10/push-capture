import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection pool singleton
let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/push_capture';

    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    db = drizzle(client, { schema });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      if (client) {
        await client.end();
      }
    });

    process.on('SIGINT', async () => {
      if (client) {
        await client.end();
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      if (client) {
        await client.end();
      }
      process.exit(0);
    });
  }

  return db;
}

// Re-export schema for convenience
export * from './schema';
