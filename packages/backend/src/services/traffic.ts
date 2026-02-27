import { count, desc, eq } from 'drizzle-orm';
import { db, type TrafficEvent, trafficEvents } from '../db/index.js';

interface CaptureTrafficInput {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  source: string;
  metadata?: Record<string, unknown>;
}

interface TrafficStats {
  total: number;
  byMethod: Record<string, number>;
  bySource: Record<string, number>;
  topUrls: Array<{ url: string; count: number }>;
}

export const trafficService = {
  capture: async (data: CaptureTrafficInput): Promise<TrafficEvent> => {
    const newEvent = {
      id: crypto.randomUUID(),
      url: data.url,
      method: data.method,
      headers: data.headers,
      body: data.body,
      source: data.source,
      metadata: data.metadata,
      createdAt: new Date(),
    };

    const result = await db.insert(trafficEvents).values(newEvent).returning();

    return result[0];
  },

  getAll: async (limit = 100, offset = 0): Promise<TrafficEvent[]> => {
    const result = await db
      .select()
      .from(trafficEvents)
      .orderBy(desc(trafficEvents.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  },

  getById: async (id: string): Promise<TrafficEvent | undefined> => {
    const result = await db.select().from(trafficEvents).where(eq(trafficEvents.id, id)).limit(1);
    return result[0];
  },

  getStats: async (): Promise<TrafficStats> => {
    // Get total count
    const totalResult = await db.select({ count: count() }).from(trafficEvents);
    const total = totalResult[0]?.count || 0;

    // Get stats by method using SQL aggregation
    const byMethodResult = await db
      .select({
        method: trafficEvents.method,
        count: count(),
      })
      .from(trafficEvents)
      .groupBy(trafficEvents.method);

    const byMethod: Record<string, number> = {};
    for (const row of byMethodResult) {
      byMethod[row.method] = row.count;
    }

    // Get stats by source
    const bySourceResult = await db
      .select({
        source: trafficEvents.source,
        count: count(),
      })
      .from(trafficEvents)
      .groupBy(trafficEvents.source);

    const bySource: Record<string, number> = {};
    for (const row of bySourceResult) {
      bySource[row.source] = row.count;
    }

    // Get top URLs
    const topUrlsResult = await db
      .select({
        url: trafficEvents.url,
        count: count(),
      })
      .from(trafficEvents)
      .groupBy(trafficEvents.url)
      .orderBy(desc(count()))
      .limit(10);

    const topUrls = topUrlsResult.map((row) => ({
      url: row.url,
      count: row.count,
    }));

    return {
      total,
      byMethod,
      bySource,
      topUrls,
    };
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(trafficEvents).where(eq(trafficEvents.id, id)).returning();
    return result.length > 0;
  },

  clear: async (): Promise<void> => {
    await db.delete(trafficEvents);
  },
};
