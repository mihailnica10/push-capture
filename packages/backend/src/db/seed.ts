import { getDatabase, vapidConfig } from './index';
import { eq } from 'drizzle-orm';

const db = getDatabase();

async function seed() {
  console.log('🌱 Seeding database...');

  // Check if VAPID config already exists
  const existing = await db.select().from(vapidConfig).where(eq(vapidConfig.id, 'default'));

  if (existing.length > 0) {
    console.log('✅ VAPID config already exists, skipping seed');
    return;
  }

  // Get VAPID keys from environment or generate placeholder
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib47JZv3f4NY_1Iq0ggB7c2ZPYY8vI5zDZbNLGvY3vFvqKVgB7qLw6RGkF8';
  const privateKey = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  if (privateKey === 'YOUR_PRIVATE_KEY_HERE') {
    console.warn('⚠️  Using placeholder VAPID keys. Generate real keys with: npx web-push generate-vapid-keys');
  }

  // Insert VAPID config
  await db.insert(vapidConfig).values({
    id: 'default',
    publicKey,
    privateKey,
    subject,
  });

  console.log('✅ Seed completed');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
