import { pgTable, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Subscription status enum
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'failed']);

// Subscriptions table - stores web push subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Traffic events table - stores captured HTTP traffic
export const trafficEvents = pgTable('traffic_events', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  method: text('method').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>(),
  body: jsonb('body').$type<unknown>(),
  source: text('source').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// VAPID config table - stores VAPID keys (singleton pattern)
export const vapidConfig = pgTable('vapid_config', {
  id: text('id').primaryKey().default('default'),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  subject: text('subject').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type exports for use in services
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type TrafficEvent = typeof trafficEvents.$inferSelect;
export type NewTrafficEvent = typeof trafficEvents.$inferInsert;
export type VapidConfig = typeof vapidConfig.$inferSelect;
export type NewVapidConfig = typeof vapidConfig.$inferInsert;
