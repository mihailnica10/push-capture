import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection pool singleton
let client: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDatabase() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    dbInstance = drizzle(client, { schema });

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

  return dbInstance;
}

// Export db instance for direct access
export const db = getDatabase();

// Re-export schema for convenience
export * from './schema';
