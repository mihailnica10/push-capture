interface TrafficEvent {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  source: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

interface TrafficStats {
  total: number;
  byMethod: Record<string, number>;
  bySource: Record<string, number>;
  topUrls: Array<{ url: string; count: number }>;
}

// In-memory storage
const trafficEvents = new Map<string, TrafficEvent>();

export const trafficService = {
  capture: async (data: Omit<TrafficEvent, 'id' | 'createdAt'>): Promise<TrafficEvent> => {
    const event: TrafficEvent = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    trafficEvents.set(event.id, event);
    return event;
  },

  getAll: async (limit = 100, offset = 0): Promise<TrafficEvent[]> => {
    return Array.from(trafficEvents.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  },

  getById: async (id: string): Promise<TrafficEvent | undefined> => {
    return trafficEvents.get(id);
  },

  getStats: async (): Promise<TrafficStats> => {
    const events = Array.from(trafficEvents.values());

    const byMethod: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const urlCounts: Record<string, number> = {};

    for (const event of events) {
      byMethod[event.method] = (byMethod[event.method] || 0) + 1;
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      urlCounts[event.url] = (urlCounts[event.url] || 0) + 1;
    }

    const topUrls = Object.entries(urlCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: events.length,
      byMethod,
      bySource,
      topUrls,
    };
  },

  delete: async (id: string): Promise<boolean> => {
    return trafficEvents.delete(id);
  },

  clear: async (): Promise<void> => {
    trafficEvents.clear();
  },
};
