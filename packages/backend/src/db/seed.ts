import { eq } from 'drizzle-orm';
import { db, vapidConfig } from './index.js';
import { logger } from '../lib/logger.js';

async function seed() {
  logger.info('Starting database seed...');

  // Check if VAPID config already exists
  const existing = await db.select().from(vapidConfig).where(eq(vapidConfig.id, 'default'));

  if (existing.length > 0) {
    logger.info('VAPID config already exists, skipping seed');
    return;
  }

  // Validate required environment variables
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    logger.error(
      { hasPublicKey: !!publicKey, hasPrivateKey: !!privateKey, hasSubject: !!subject },
      'Missing required VAPID environment variables. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT.'
    );
    logger.error('Generate keys with: npx web-push generate-vapid-keys');
    process.exit(1);
  }

  // Insert VAPID config
  await db.insert(vapidConfig).values({
    id: 'default',
    publicKey,
    privateKey,
    subject,
  });

  logger.info('Database seed completed successfully');
}

seed().catch((error) => {
  logger.error({ error }, 'Database seed failed');
  process.exit(1);
});
