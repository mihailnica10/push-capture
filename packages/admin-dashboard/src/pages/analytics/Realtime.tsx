/**
 * Realtime Analytics Page
 * Live user activity and session monitoring
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AnalyticsMap } from '../../components/analytics/maps/AnalyticsMap';
import { cn } from '../../styles/theme';

// ==================== Types ====================

interface RealtimeUser {
  id: string;
  sessionId: string;
  page: string;
  pageViewId: string;
  country: string;
  city?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  browser: string;
  os: string;
  deviceType: string;
  startTime: string;
  lastActivity: string;
  duration: number;
}

interface RealtimeStats {
  activeNow: number;
  pageViewsLastMinute: number;
  pageViewsLast5Minutes: number;
  pageViewsLast15Minutes: number;
  topPages: { page: string; views: number }[];
}

interface LiveEvent {
  id: string;
  type: 'pageView' | 'click' | 'error' | 'conversion';
  page: string;
  timestamp: string;
  user: {
    browser: string;
    country: string;
  };
}

// ==================== Helper Components ====================

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    pageView: 'bg-blue-100 text-blue-700',
    click: 'bg-purple-100 text-purple-700',
    error: 'bg-red-100 text-red-700',
    conversion: 'bg-green-100 text-green-700',
  };

  const icons: Record<string, string> = {
    pageView: '👁️',
    click: '👆',
    error: '⚠️',
    conversion: '✅',
  };

  return (
    <span
      className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[type] || styles.pageView)}
    >
      {icons[type] || '•'} {type}
    </span>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ==================== Component ====================

export function RealtimeAnalytics() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch realtime stats
  const { data: realtimeStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-realtime'],
    queryFn: async (): Promise<RealtimeStats> => {
      const response = await fetch('/api/analytics/realtime');
      if (!response.ok) throw new Error('Failed to fetch realtime stats');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch active users
  const { data: activeUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['analytics-active-users'],
    queryFn: async (): Promise<RealtimeUser[]> => {
      const response = await fetch('/api/analytics/active-users');
      if (!response.ok) throw new Error('Failed to fetch active users');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Simulate live events (in real app, this would be SSE or WebSocket)
  useEffect(() => {
    const eventTypes: Array<'pageView' | 'click' | 'error' | 'conversion'> = [
      'pageView',
      'click',
      'conversion',
    ];
    const pages = ['/dashboard', '/campaigns', '/analytics', '/settings', '/subscriptions'];

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: LiveEvent = {
          id: `${Date.now()}-${Math.random()}`,
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          page: pages[Math.floor(Math.random() * pages.length)],
          timestamp: new Date().toISOString(),
          user: {
            browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
            country: ['US', 'UK', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 5)],
          },
        };

        setLiveEvents((prev) => [newEvent, ...prev].slice(0, 20));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Prepare map markers from active users
  const mapMarkers =
    activeUsers
      ?.filter((u) => u.lat && u.lon)
      .map((user) => ({
        id: user.sessionId,
        lat: user.lat!,
        lon: user.lon!,
        country: user.country,
        countryCode: user.countryCode || '',
        city: user.city,
        count: 1,
      })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Realtime Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Live user activity and session monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn('w-2 h-2 rounded-full', !statsLoading && 'bg-success-500 animate-pulse')}
          />
          <span className="text-sm text-neutral-500">
            Last updated: {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveStatCard
          title="Active Now"
          value={realtimeStats?.activeNow ?? 0}
          subtitle="Current users on site"
          color="primary"
          loading={statsLoading}
        />
        <LiveStatCard
          title="Page Views (1m)"
          value={realtimeStats?.pageViewsLastMinute ?? 0}
          subtitle="In the last minute"
          color="success"
          loading={statsLoading}
        />
        <LiveStatCard
          title="Page Views (5m)"
          value={realtimeStats?.pageViewsLast5Minutes ?? 0}
          subtitle="In the last 5 minutes"
          color="accent"
          loading={statsLoading}
        />
        <LiveStatCard
          title="Page Views (15m)"
          value={realtimeStats?.pageViewsLast15Minutes ?? 0}
          subtitle="In the last 15 minutes"
          color="neutral"
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Map */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Active Users Map</h3>
          {usersLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : (
            <AnalyticsMap markers={mapMarkers} height={350} clusterMarkers={false} />
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Live Activity</h3>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-sm">
                Waiting for events...
              </div>
            ) : (
              liveEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                  <EventTypeBadge type={event.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {event.page}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {event.user.browser} · {event.user.country} ·{' '}
                      {formatRelativeTime(new Date(event.timestamp))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">Top Pages Right Now</h3>
        {statsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {realtimeStats?.topPages.slice(0, 10).map((page, index) => (
              <div
                key={page.page}
                className={cn(
                  'p-4 rounded-lg border',
                  index === 0
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-neutral-50 border-neutral-200'
                )}
              >
                <div className="text-sm text-neutral-600 truncate" title={page.page}>
                  {page.page}
                </div>
                <div className="text-xl font-bold text-neutral-900 mt-1">{page.views}</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {page.views === 1 ? 'user' : 'users'}
                </div>
              </div>
            )) ?? []}
          </div>
        )}
      </div>

      {/* Active Users Table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">
          Currently Active Users ({activeUsers?.length ?? 0})
        </h3>
        {usersLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : !activeUsers || activeUsers.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            No active users right now
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {activeUsers.slice(0, 20).map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-neutral-900">{user.browser}</div>
                      <div className="text-xs text-neutral-500">{user.os}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-neutral-700 truncate max-w-[200px]" title={user.page}>
                        {user.page}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {user.city && <span>{user.city}, </span>}
                      {user.country}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {formatDuration(user.duration)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {formatRelativeTime(new Date(user.lastActivity))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Sub-Components ====================

interface LiveStatCardProps {
  title: string;
  value: number;
  subtitle: string;
  color: 'primary' | 'success' | 'accent' | 'neutral';
  loading?: boolean;
}

function LiveStatCard({ title, value, subtitle, color, loading }: LiveStatCardProps) {
  const colorStyles = {
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-success-50 border-success-200',
    accent: 'bg-accent-50 border-accent-200',
    neutral: 'bg-neutral-50 border-neutral-200',
  };

  const valueColor = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    accent: 'text-accent-600',
    neutral: 'text-neutral-600',
  };

  return (
    <div className={cn('border rounded-xl p-4', colorStyles[color])}>
      <p className="text-sm text-neutral-600">{title}</p>
      {loading ? (
        <div className="h-8 bg-neutral-200 rounded animate-pulse mt-1" />
      ) : (
        <p className={cn('text-3xl font-bold mt-1', valueColor[color])}>{value.toLocaleString()}</p>
      )}
      <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
    </div>
  );
}

export default RealtimeAnalytics;
