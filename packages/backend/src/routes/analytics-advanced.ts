/**
 * Advanced Analytics Routes
 * Provides comprehensive analytics data for the admin dashboard
 */

import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../db/index.js';
import {
  devices,
  errorTracking,
  geolocationEvents,
  pageViews,
  userSessions,
  webVitals,
} from '../db/schema.js';

export const analyticsAdvancedRoutes = new Hono();

// ==================== Geographic Distribution ====================

analyticsAdvancedRoutes.get('/geo-distribution', async (c) => {
  const days = parseInt(c.req.query('days') || '30', 10);
  const level = c.req.query('level') || 'country'; // 'country' or 'city'

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get geolocation data grouped by country/city
  const geoData = await db
    .select({
      country: geolocationEvents.countryName,
      countryCode: geolocationEvents.countryCode,
      city: geolocationEvents.city,
      lat: sql<number>`AVG(${geolocationEvents.latitude})`.mapWith(Number),
      lon: sql<number>`AVG(${geolocationEvents.longitude})`.mapWith(Number),
      sessions: count(sql<number>`DISTINCT ${geolocationEvents.sessionId}`),
    })
    .from(geolocationEvents)
    .where(gte(geolocationEvents.timestamp, startDate))
    .groupBy(
      level === 'city' ? geolocationEvents.city : geolocationEvents.countryName,
      geolocationEvents.countryCode
    )
    .orderBy(desc(count(sql<number>`DISTINCT ${geolocationEvents.sessionId}`)))
    .limit(100);

  // Return the data
  return c.json(
    geoData.map((g) => ({
      country: g.country || 'Unknown',
      countryCode: g.countryCode || '',
      city: level === 'city' ? g.city || undefined : undefined,
      lat: Number(g.lat) || 0,
      lon: Number(g.lon) || 0,
      sessions: Number(g.sessions) || 0,
      pageViews: Number(g.sessions) || 0, // Approximate
      avgDuration: 120, // Placeholder - would need to join with sessions
      trend: 0, // Placeholder - would need historical comparison
    }))
  );
});

// ==================== Web Vitals Summary ====================

analyticsAdvancedRoutes.get('/web-vitals-summary', async (c) => {
  const days = parseInt(c.req.query('days') || '30', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'] as const;

  const result: Record<
    string,
    {
      avg: number;
      good: number;
      needsImprovement: number;
      poor: number;
    }
  > = {};

  for (const metric of metrics) {
    const data = await db
      .select({
        avgValue: sql<number>`AVG(${webVitals.value})`.mapWith(Number),
        rating: webVitals.rating,
        count: count(),
      })
      .from(webVitals)
      .where(and(gte(webVitals.timestamp, startDate), eq(webVitals.metricType, metric)))
      .groupBy(webVitals.rating);

    let totalSamples = 0;
    const ratingCounts = {
      good: 0,
      'needs-improvement': 0,
      poor: 0,
    };

    let weightedSum = 0;

    for (const row of data) {
      const cnt = Number(row.count) || 0;
      totalSamples += cnt;
      ratingCounts[row.rating as keyof typeof ratingCounts] = cnt;
      weightedSum += (Number(row.avgValue) || 0) * cnt;
    }

    result[metric.toLowerCase()] = {
      avg: totalSamples > 0 ? weightedSum / totalSamples : 0,
      good: ratingCounts.good,
      needsImprovement: ratingCounts['needs-improvement'],
      poor: ratingCounts.poor,
    };
  }

  return c.json(result);
});

// ==================== Page Performance ====================

analyticsAdvancedRoutes.get('/page-performance', async (c) => {
  const days = parseInt(c.req.query('days') || '30', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get performance metrics by URL
  const performance = await db
    .select({
      url: pageViews.path,
      path: pageViews.path,
      lcp: sql<number>`AVG(CASE WHEN ${webVitals.metricType} = 'LCP' THEN ${webVitals.value} END)`.mapWith(
        Number
      ),
      fid: sql<number>`AVG(CASE WHEN ${webVitals.metricType} = 'FID' THEN ${webVitals.value} END)`.mapWith(
        Number
      ),
      cls: sql<number>`AVG(CASE WHEN ${webVitals.metricType} = 'CLS' THEN ${webVitals.value} END)`.mapWith(
        Number
      ),
      samples: count(sql<number>`DISTINCT ${pageViews.id}`),
    })
    .from(pageViews)
    .leftJoin(webVitals, eq(pageViews.id, webVitals.pageViewId))
    .where(gte(pageViews.viewedAt, startDate))
    .groupBy(pageViews.path)
    .orderBy(desc(count(sql<number>`DISTINCT ${pageViews.id}`)))
    .limit(20);

  return c.json(
    performance.map((p) => {
      const lcp = Number(p.lcp) || 0;
      const fid = Number(p.fid) || 0;
      const cls = Number(p.cls) || 0;

      // Determine overall rating
      let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
      if (lcp > 4000 || fid > 300 || cls > 0.25) rating = 'poor';
      else if (lcp > 2500 || fid > 100 || cls > 0.1) rating = 'needs-improvement';

      return {
        id: p.url,
        url: p.url,
        path: p.path,
        lcp,
        fid,
        cls,
        rating,
        samples: Number(p.samples) || 0,
      };
    })
  );
});

// ==================== Device Breakdown ====================

analyticsAdvancedRoutes.get('/device-breakdown', async (c) => {
  const days = parseInt(c.req.query('days') || '30', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const deviceData = await db
    .select({
      browserName: devices.browserName,
      browserVersion: devices.browserVersion,
      osName: devices.osName,
      osVersion: devices.osVersion,
      deviceType: devices.deviceType,
      count: count(sql<number>`DISTINCT ${devices.deviceFingerprint}`),
    })
    .from(devices)
    .where(gte(devices.lastSeen, startDate))
    .groupBy(devices.browserName, devices.osName, devices.deviceType)
    .orderBy(desc(count(sql<number>`DISTINCT ${devices.deviceFingerprint}`)))
    .limit(50);

  const totalCount = deviceData.reduce((sum, d) => sum + Number(d.count), 0);

  return c.json(
    deviceData.map((d) => ({
      id: `${d.browserName}-${d.osName}-${d.deviceType}`.replace(/\s+/g, '-').toLowerCase(),
      browserName: d.browserName || 'Unknown',
      browserVersion: d.browserVersion || undefined,
      osName: d.osName || 'Unknown',
      osVersion: d.osVersion || undefined,
      deviceType: d.deviceType || 'unknown',
      count: Number(d.count) || 0,
      percentage: totalCount > 0 ? (Number(d.count) / totalCount) * 100 : 0,
      trend: 0, // Would need historical data
    }))
  );
});

// ==================== Error Analytics ====================

analyticsAdvancedRoutes.get('/errors-summary', async (c) => {
  const days = parseInt(c.req.query('days') || '7', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const errors = await db
    .select({
      total: count(),
      critical: count(sql<number>`CASE WHEN ${errorTracking.severity} = 'critical' THEN 1 END`),
      warnings: count(sql<number>`CASE WHEN ${errorTracking.severity} = 'warning' THEN 1 END`),
    })
    .from(errorTracking)
    .where(gte(errorTracking.timestamp, startDate));

  const error = errors[0];

  // Get top error types
  const typeBreakdown = await db
    .select({
      type: errorTracking.errorType,
      count: count(),
    })
    .from(errorTracking)
    .where(gte(errorTracking.timestamp, startDate))
    .groupBy(errorTracking.errorType)
    .orderBy(desc(count()))
    .limit(5);

  // Calculate error rate (errors per 1000 sessions)
  const sessionCount = await db
    .select({ count: count() })
    .from(userSessions)
    .where(gte(userSessions.startedAt, startDate));

  const totalSessions = Number(sessionCount[0]?.count) || 1;
  const errorCount = Number(error?.total) || 0;

  return c.json({
    total: errorCount,
    critical: Number(error?.critical) || 0,
    warnings: Number(error?.warnings) || 0,
    rate: (errorCount / totalSessions) * 100,
    topTypes: typeBreakdown.map((t) => ({
      type: t.type || 'unknown',
      count: Number(t.count) || 0,
    })),
  });
});

analyticsAdvancedRoutes.get('/errors-groups', async (c) => {
  const days = parseInt(c.req.query('days') || '7', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const errorGroups = await db
    .select({
      message: errorTracking.message,
      type: errorTracking.errorType,
      count: count(),
      affectedUsers: count(sql<number>`DISTINCT ${errorTracking.deviceFingerprint}`),
      firstSeen: sql<string>`MIN(${errorTracking.timestamp})`,
      lastSeen: sql<string>`MAX(${errorTracking.timestamp})`,
      url: errorTracking.urlPath,
      browser: devices.browserName,
      os: devices.osName,
    })
    .from(errorTracking)
    .leftJoin(devices, eq(errorTracking.deviceFingerprint, devices.deviceFingerprint))
    .where(gte(errorTracking.timestamp, startDate))
    .groupBy(errorTracking.message, errorTracking.errorType, errorTracking.urlPath)
    .orderBy(desc(count()))
    .limit(50);

  return c.json(
    errorGroups.map((g) => ({
      id: `${g.type}-${g.message}`.substring(0, 50).replace(/\s+/g, '-'),
      message: g.message || 'Unknown error',
      type: g.type || 'error',
      count: Number(g.count) || 0,
      affectedUsers: Number(g.affectedUsers) || 0,
      firstSeen: g.firstSeen || new Date().toISOString(),
      lastSeen: g.lastSeen || new Date().toISOString(),
      url: g.url || undefined,
      browser: g.browser || undefined,
      os: g.os || undefined,
      trend: 0, // Would need historical comparison
    }))
  );
});

analyticsAdvancedRoutes.get('/errors-trends', async (c) => {
  const days = parseInt(c.req.query('days') || '7', 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trends = await db
    .select({
      date: sql<string>`DATE(${errorTracking.timestamp})`,
      errors: count(),
      users: count(sql<number>`DISTINCT ${errorTracking.deviceFingerprint}`),
    })
    .from(errorTracking)
    .where(gte(errorTracking.timestamp, startDate))
    .groupBy(sql`DATE(${errorTracking.timestamp})`)
    .orderBy(sql`DATE(${errorTracking.timestamp})`);

  return c.json(
    trends.map((t) => ({
      date: t.date,
      errors: Number(t.errors) || 0,
      users: Number(t.users) || 0,
    }))
  );
});

// ==================== Realtime Analytics ====================

analyticsAdvancedRoutes.get('/realtime', async (c) => {
  // Active users in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [activeNow, pageViewsLastMin, pageViewsLast5Min, pageViewsLast15Min, topPages] =
    await Promise.all([
      db
        .select({ count: count(sql<number>`DISTINCT ${userSessions.deviceFingerprint}`) })
        .from(userSessions)
        .where(gte(userSessions.startedAt, fiveMinutesAgo)),
      db
        .select({ count: count() })
        .from(pageViews)
        .where(gte(pageViews.viewedAt, new Date(Date.now() - 60 * 1000))),
      db.select({ count: count() }).from(pageViews).where(gte(pageViews.viewedAt, fiveMinutesAgo)),
      db
        .select({ count: count() })
        .from(pageViews)
        .where(gte(pageViews.viewedAt, new Date(Date.now() - 15 * 60 * 1000))),
      db
        .select({
          page: pageViews.path,
          views: count(sql<number>`DISTINCT ${pageViews.deviceFingerprint}`),
        })
        .from(pageViews)
        .where(gte(pageViews.viewedAt, new Date(Date.now() - 5 * 60 * 1000)))
        .groupBy(pageViews.path)
        .orderBy(desc(count(sql<number>`DISTINCT ${pageViews.deviceFingerprint}`)))
        .limit(10),
    ]);

  return c.json({
    activeNow: Number(activeNow[0]?.count) || 0,
    pageViewsLastMinute: Number(pageViewsLastMin[0]?.count) || 0,
    pageViewsLast5Minutes: Number(pageViewsLast5Min[0]?.count) || 0,
    pageViewsLast15Minutes: Number(pageViewsLast15Min[0]?.count) || 0,
    topPages: topPages.map((p) => ({
      page: p.page,
      views: Number(p.views) || 0,
    })),
  });
});

analyticsAdvancedRoutes.get('/active-users', async (c) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      page: pageViews.path,
      pageViewId: pageViews.id,
      country: geolocationEvents.countryName,
      city: geolocationEvents.city,
      countryCode: geolocationEvents.countryCode,
      lat: sql<number>`AVG(${geolocationEvents.latitude})`.mapWith(Number),
      lon: sql<number>`AVG(${geolocationEvents.longitude})`.mapWith(Number),
      browser: devices.browserName,
      os: devices.osName,
      deviceType: devices.deviceType,
      startTime: userSessions.startedAt,
      lastActivity: sql<string>`MAX(GREATEST(${userSessions.startedAt}, ${pageViews.viewedAt}))`,
      duration: sql<number>`EXTRACT(EPOCH FROM (NOW() - ${userSessions.startedAt}))`.mapWith(
        Number
      ),
    })
    .from(userSessions)
    .leftJoin(pageViews, eq(pageViews.sessionId, userSessions.sessionId))
    .leftJoin(geolocationEvents, eq(geolocationEvents.sessionId, userSessions.sessionId))
    .leftJoin(devices, eq(devices.deviceFingerprint, userSessions.deviceFingerprint))
    .where(gte(userSessions.startedAt, fiveMinutesAgo))
    .groupBy(
      userSessions.id,
      pageViews.path,
      pageViews.id,
      devices.browserName,
      devices.osName,
      devices.deviceType,
      geolocationEvents.countryName,
      geolocationEvents.city,
      geolocationEvents.countryCode
    )
    .orderBy(desc(sql`MAX(GREATEST(${userSessions.startedAt}, ${pageViews.viewedAt}))`))
    .limit(100);

  return c.json(
    activeSessions.map((s) => ({
      id: s.id,
      sessionId: s.sessionId,
      page: s.page || '/',
      pageViewId: s.pageViewId || s.id,
      country: s.country || 'Unknown',
      city: s.city || undefined,
      countryCode: s.countryCode || '',
      lat: Number(s.lat) || undefined,
      lon: Number(s.lon) || undefined,
      browser: s.browser || 'Unknown',
      os: s.os || 'Unknown',
      deviceType: s.deviceType || 'unknown',
      startTime: s.startTime?.toISOString() || new Date().toISOString(),
      lastActivity: s.lastActivity || new Date().toISOString(),
      duration: Number(s.duration) || 0,
    }))
  );
});

// ==================== Screen Resolutions ====================

analyticsAdvancedRoutes.get('/screen-resolutions', async (c) => {
  const resolutions = await db
    .select({
      resolution: userSessions.screenResolution,
      count: count(),
    })
    .from(userSessions)
    .where(sql`${userSessions.screenResolution} IS NOT NULL`)
    .groupBy(userSessions.screenResolution)
    .orderBy(desc(count()))
    .limit(20);

  const total = resolutions.reduce((sum, r) => sum + Number(r.count), 0);

  return c.json(
    resolutions.map((r) => ({
      resolution: r.resolution || 'unknown',
      width: parseInt(r.resolution?.split('x')[0] || '0', 10),
      height: parseInt(r.resolution?.split('x')[1] || '0', 10),
      count: Number(r.count) || 0,
      percentage: total > 0 ? (Number(r.count) / total) * 100 : 0,
    }))
  );
});

// ==================== Device Capabilities ====================

analyticsAdvancedRoutes.get('/capabilities', async (c) => {
  // Mock capability data for now - in production, calculate from featureUsage table
  const capabilities = [
    { feature: 'WebGL', supported: 850, notSupported: 15, supportRate: 98.3 },
    { feature: 'WebRTC', supported: 790, notSupported: 75, supportRate: 91.3 },
    { feature: 'Service Worker', supported: 860, notSupported: 5, supportRate: 99.4 },
    { feature: 'Geolocation', supported: 840, notSupported: 25, supportRate: 97.1 },
    { feature: 'Notifications', supported: 865, notSupported: 0, supportRate: 100 },
    { feature: 'Bluetooth API', supported: 520, notSupported: 345, supportRate: 60.1 },
    { feature: 'WebUSB', supported: 380, notSupported: 485, supportRate: 43.9 },
    { feature: 'WebAssembly', supported: 845, notSupported: 20, supportRate: 97.7 },
  ];

  return c.json(capabilities);
});

export default analyticsAdvancedRoutes;
