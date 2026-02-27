import {
  faAndroid as faAndroidBrand,
  faApple as faAppleBrand,
  faChrome as faChromeBrand,
  faEdge as faEdgeBrand,
  faFirefox as faFirefoxBrand,
  faSafari as faSafariBrand,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCalendar,
  faChartLine,
  faCheckCircle,
  faClock,
  faDesktop,
  faEye,
  faFilter,
  faGlobe,
  faMobileScreen,
  faMousePointer,
  faPaperPlane,
  faTabletScreenButton,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';

interface OverallStats {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  failed?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
}

export function Analytics() {
  const [days, setDays] = useState(30);

  const { data: overallStats } = useQuery({
    queryKey: ['analytics-overall', days],
    queryFn: () => api.getOverallStats(days),
  });

  const { data: platformBreakdown, isLoading: platformLoading } = useQuery({
    queryKey: ['analytics-platform', days],
    queryFn: () => api.getPlatformBreakdown(days),
  });

  const { data: hourlyActivity, isLoading: hourlyLoading } = useQuery({
    queryKey: ['analytics-hourly', 7],
    queryFn: () => api.getHourlyActivity(7),
  });

  const { data: deviceStats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: () => api.getDeviceStats(),
  });

  const { data: campaignPerformance } = useQuery({
    queryKey: ['campaign-performance', days],
    queryFn: () => api.getCampaignPerformance(days),
  });

  const stats = overallStats as OverallStats | undefined;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  // Process platform breakdown for display
  const platformData: Record<string, Record<string, number>> = {};
  if (Array.isArray(platformBreakdown)) {
    for (const item of platformBreakdown) {
      if (!item.platform) continue;
      if (!platformData[item.platform]) {
        platformData[item.platform] = {};
      }
      platformData[item.platform][item.eventType] =
        (platformData[item.platform][item.eventType] || 0) + item.count;
    }
  }

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('ios') || p === 'apple') return { icon: faAppleBrand, color: 'text-gray-700' };
    if (p.includes('android')) return { icon: faAndroidBrand, color: 'text-green-600' };
    if (p.includes('desktop')) return { icon: faDesktop, color: 'text-blue-600' };
    if (p.includes('tablet')) return { icon: faTabletScreenButton, color: 'text-purple-600' };
    return { icon: faMobileScreen, color: 'text-gray-600' };
  };

  // Get browser icon
  const getBrowserIcon = (browser: string) => {
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return { icon: faChromeBrand, color: 'text-blue-500' };
    if (b.includes('firefox')) return { icon: faFirefoxBrand, color: 'text-orange-500' };
    if (b.includes('safari')) return { icon: faSafariBrand, color: 'text-blue-400' };
    if (b.includes('edge')) return { icon: faEdgeBrand, color: 'text-blue-600' };
    return { icon: faGlobe, color: 'text-gray-400' };
  };

  // Process hourly activity
  const hourlyData: Record<number, Record<string, number>> = {};
  if (Array.isArray(hourlyActivity)) {
    for (const item of hourlyActivity) {
      const hour = item.hour ?? 0;
      if (!hourlyData[hour]) {
        hourlyData[hour] = {};
      }
      hourlyData[hour][item.eventType] = (hourlyData[hour][item.eventType] || 0) + item.count;
    }
  }

  const hourlyCounts = Object.values(hourlyData).flatMap((events) => Object.values(events));
  const maxHourlyCount = hourlyCounts.length > 0 ? Math.max(...hourlyCounts) : 1;

  // Calculate optimal send times
  const optimalHours = Object.entries(hourlyData)
    .map(([hour, events]) => ({
      hour: parseInt(hour, 10),
      total: (events.opened || 0) + (events.delivered || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalSent = stats?.sent || stats?.delivered || 0;
  const totalOpened = stats?.opened || 0;
  const totalClicked = stats?.clicked || 0;
  const totalFailed = stats?.failed || 0;
  const deliveryRate =
    stats?.deliveryRate || (totalSent > 0 ? ((totalSent - totalFailed) / totalSent) * 100 : 0);
  const openRate = stats?.openRate || (totalSent > 0 ? (totalOpened / totalSent) * 100 : 0);
  const clickRate = stats?.clickRate || (totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your push notification performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FontAwesomeIcon icon={faCalendar} />
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <FontAwesomeIcon icon={faFilter} />
            Filter
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          title="Total Sent"
          value={formatNumber(totalSent)}
          icon={faPaperPlane}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Delivered"
          value={formatNumber(totalSent - totalFailed)}
          icon={faCheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          subtitle={`${deliveryRate.toFixed(1)}% delivery rate`}
        />
        <MetricCard
          title="Opened"
          value={formatNumber(totalOpened)}
          icon={faEye}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          subtitle={`${openRate.toFixed(1)}% open rate`}
        />
        <MetricCard
          title="Clicked"
          value={formatNumber(totalClicked)}
          icon={faMousePointer}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          subtitle={`${clickRate.toFixed(1)}% click rate`}
        />
        <MetricCard
          title="Subscribers"
          value={formatNumber(deviceStats?.stats?.total || 0)}
          icon={faUsers}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Platform Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Platform Breakdown</h2>
            <FontAwesomeIcon icon={faMobileScreen} className="text-gray-400" />
          </div>
          {platformLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : Object.keys(platformData).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No data available</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformData).map(([platform, events]) => {
                const delivered = events.delivered || 0;
                const opened = events.opened || 0;
                const total = delivered + opened;
                const platformInfo = getPlatformIcon(platform);
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={platformInfo.icon} className={platformInfo.color} />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {platform}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(total)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      {delivered > 0 && total > 0 && (
                        <div
                          className="bg-blue-500"
                          style={{ width: `${(delivered / total) * 100}%` }}
                        />
                      )}
                      {opened > 0 && total > 0 && (
                        <div
                          className="bg-green-500"
                          style={{ width: `${(opened / total) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browser Breakdown */}
        {deviceStats?.stats?.byBrowser && deviceStats.stats.byBrowser.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Browser Distribution</h2>
              <FontAwesomeIcon icon={faGlobe} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {deviceStats.stats.byBrowser.slice(0, 5).map((browser) => {
                const browserInfo = getBrowserIcon(browser.browserName);
                const total = deviceStats.stats.byBrowser.reduce((sum, b) => sum + b.count, 0);
                const percentage = total > 0 ? ((browser.count / total) * 100).toFixed(1) : '0';
                return (
                  <div key={browser.browserName}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={browserInfo.icon} className={browserInfo.color} />
                        <span className="text-sm font-medium text-gray-700">
                          {browser.browserName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(browser.count)}
                        </span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Device Type Breakdown */}
        {deviceStats?.stats?.byPlatform && deviceStats.stats.byPlatform.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Device Types</h2>
              <FontAwesomeIcon icon={faDesktop} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {deviceStats.stats.byPlatform.map((platform) => {
                const platformInfo = getPlatformIcon(platform.platform);
                return (
                  <div
                    key={platform.platform}
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <FontAwesomeIcon
                      icon={platformInfo.icon}
                      className={`text-2xl mb-2 ${platformInfo.color}`}
                    />
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {platform.platform}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNumber(platform.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Hourly Activity Heatmap */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Activity by Hour (Last 7 Days)</h2>
            <FontAwesomeIcon icon={faClock} className="text-gray-400" />
          </div>
          {hourlyLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end justify-between h-36 gap-0.5">
                {Array.from({ length: 24 }, (_, hour) => {
                  const count =
                    (hourlyData[hour]?.opened || 0) + (hourlyData[hour]?.delivered || 0);
                  const height = (count / maxHourlyCount) * 100;
                  const isActive = count > 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center group">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isActive ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-gray-100'
                        }`}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${hour}:00 - ${count} events`}
                      />
                      <span className="text-[10px] text-gray-400 mt-1">{hour}</span>
                    </div>
                  );
                })}
              </div>
              {/* Optimal send times */}
              {optimalHours.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Best performing hours:</p>
                  <div className="flex flex-wrap gap-1">
                    {optimalHours.map(({ hour }) => (
                      <span
                        key={hour}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                      >
                        <FontAwesomeIcon icon={faClock} className="text-[8px]" />
                        {hour}:00
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Campaign Performance</h2>
            <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
          </div>
          {!campaignPerformance ||
          (Array.isArray(campaignPerformance) && campaignPerformance.length === 0) ? (
            <div className="text-center py-8 text-gray-400 text-sm">No campaign data yet</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(Array.isArray(campaignPerformance) ? campaignPerformance : [])
                .slice(0, 6)
                .map((campaign) => {
                  const openRate = campaign.openRate || 0;
                  const clickRate = campaign.clickRate || 0;
                  return (
                    <div
                      key={campaign.campaignId}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">
                          {campaign.campaignName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatNumber(campaign.sent)} sent
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faEye} className="text-purple-500" />
                          <span className="text-gray-600">{openRate.toFixed(1)}% opened</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faMousePointer} className="text-orange-500" />
                          <span className="text-gray-600">{clickRate.toFixed(1)}% clicked</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex mt-2">
                        <div
                          className="bg-purple-500"
                          style={{ width: `${Math.min(openRate, 100)}%` }}
                        />
                        <div
                          className="bg-orange-500"
                          style={{ width: `${Math.min(clickRate, 100 - openRate)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Funnel */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Engagement Funnel</h2>
          <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="space-y-2">
            {[
              { label: 'Notifications Sent', count: totalSent, color: 'bg-blue-500' },
              {
                label: 'Successfully Delivered',
                count: totalSent - totalFailed,
                color: 'bg-green-500',
              },
              { label: 'Opened', count: totalOpened, color: 'bg-purple-500' },
              { label: 'Clicked', count: totalClicked, color: 'bg-orange-500' },
            ].map((step, index, arr) => {
              const prevCount = index === 0 ? totalSent : arr[index - 1].count;
              const width = prevCount > 0 ? (step.count / prevCount) * 100 : 0;
              const percentage = totalSent > 0 ? ((step.count / totalSent) * 100).toFixed(1) : '0';
              return (
                <div key={step.label} className="relative">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{step.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{formatNumber(step.count)}</span>
                      <span className="text-gray-400">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(width, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  subtitle?: string;
}

function MetricCard({ title, value, icon, iconColor, bgColor, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <FontAwesomeIcon icon={icon} className={`${iconColor} text-lg`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
