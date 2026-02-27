/**
 * Devices Analytics Page
 * Detailed device, browser, and OS analytics
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart, DonutChart } from '../../components/analytics/charts/Charts';
import { MultiSelect } from '../../components/analytics/filters/MultiSelect';
import { SearchInput } from '../../components/analytics/filters/SearchInput';
import { Column, SortableTable } from '../../components/analytics/tables/SortableTable';
import PlatformBadge from '../../components/ui/PlatformBadge';
import { cn } from '../../styles/theme';

// ==================== Types ====================

interface DeviceStats {
  id: string;
  browserName: string;
  browserVersion?: string;
  osName: string;
  osVersion?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'wearable' | 'smarttv';
  count: number;
  percentage: number;
  trend: number;
}

interface ScreenResolution {
  resolution: string;
  width: number;
  height: number;
  count: number;
  percentage: number;
}

interface CapabilityStat {
  feature: string;
  supported: number;
  notSupported: number;
  supportRate: number;
}

// ==================== Component ====================

export function DevicesAnalytics() {
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [selectedOS, setSelectedOS] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch device breakdown
  const { data: deviceStats, isLoading: devicesLoading } = useQuery({
    queryKey: ['analytics-devices'],
    queryFn: async (): Promise<DeviceStats[]> => {
      const response = await fetch('/api/analytics/device-breakdown');
      if (!response.ok) throw new Error('Failed to fetch device stats');
      return response.json();
    },
  });

  // Fetch screen resolution data
  const { data: resolutions, isLoading: resolutionsLoading } = useQuery({
    queryKey: ['analytics-resolutions'],
    queryFn: async (): Promise<ScreenResolution[]> => {
      const response = await fetch('/api/analytics/screen-resolutions');
      if (!response.ok) throw new Error('Failed to fetch resolutions');
      return response.json();
    },
  });

  // Fetch capability stats
  const { data: capabilities, isLoading: capabilitiesLoading } = useQuery({
    queryKey: ['analytics-capabilities'],
    queryFn: async (): Promise<CapabilityStat[]> => {
      const response = await fetch('/api/analytics/capabilities');
      if (!response.ok) throw new Error('Failed to fetch capabilities');
      return response.json();
    },
  });

  // Prepare filter options
  const browserOptions = deviceStats
    ? Array.from(new Set(deviceStats.map((d) => d.browserName))).map((name) => ({
        value: name,
        label: name,
        count: deviceStats
          .filter((d) => d.browserName === name)
          .reduce((sum, d) => sum + d.count, 0),
      }))
    : [];

  const osOptions = deviceStats
    ? Array.from(new Set(deviceStats.map((d) => d.osName))).map((name) => ({
        value: name,
        label: name,
        count: deviceStats.filter((d) => d.osName === name).reduce((sum, d) => sum + d.count, 0),
      }))
    : [];

  const typeOptions = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'wearable', label: 'Wearable' },
    { value: 'smarttv', label: 'Smart TV' },
  ];

  // Filter data
  const filteredDevices =
    deviceStats?.filter((device) => {
      const matchesBrowser =
        selectedBrowsers.length === 0 || selectedBrowsers.includes(device.browserName);
      const matchesOS = selectedOS.length === 0 || selectedOS.includes(device.osName);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(device.deviceType);
      const matchesSearch =
        !searchQuery ||
        device.browserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.osName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesBrowser && matchesOS && matchesType && matchesSearch;
    }) ?? [];

  // Prepare chart data
  const browserChartData = deviceStats
    ? Array.from(new Set(deviceStats.map((d) => d.browserName)))
        .map((browser) => ({
          name: browser,
          value: deviceStats
            .filter((d) => d.browserName === browser)
            .reduce((sum, d) => sum + d.count, 0),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  const osChartData = deviceStats
    ? Array.from(new Set(deviceStats.map((d) => d.osName)))
        .map((os) => ({
          name: os,
          value: deviceStats.filter((d) => d.osName === os).reduce((sum, d) => sum + d.count, 0),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const deviceTypeChartData = deviceStats
    ? Array.from(new Set(deviceStats.map((d) => d.deviceType))).map((type) => ({
        name: type,
        value: deviceStats
          .filter((d) => d.deviceType === type)
          .reduce((sum, d) => sum + d.count, 0),
      }))
    : [];

  const resolutionChartData =
    resolutions?.map((r) => ({
      name: r.resolution,
      value: r.count,
    })) ?? [];

  const columns: Column<DeviceStats>[] = [
    {
      key: 'platform',
      header: 'Platform',
      sortable: false,
      render: (_: string, row) => (
        <PlatformBadge
          browser={row.browserName}
          os={row.osName}
          device={row.deviceType}
          size="sm"
          showLabels={true}
        />
      ),
    },
    {
      key: 'count',
      header: 'Users',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'percentage',
      header: 'Share',
      sortable: true,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      render: (value: number) => (
        <span
          className={cn(
            'font-medium text-sm',
            value > 5 ? 'text-success-600' : value < -5 ? 'text-error-600' : 'text-neutral-500'
          )}
        >
          {value > 0 ? '↑' : value < 0 ? '↓' : '−'} {Math.abs(value).toFixed(1)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Device Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Understand your users' devices and platforms
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MultiSelect
            options={browserOptions}
            value={selectedBrowsers}
            onChange={setSelectedBrowsers}
            placeholder="Filter by browser..."
          />
          <MultiSelect
            options={osOptions}
            value={selectedOS}
            onChange={setSelectedOS}
            placeholder="Filter by OS..."
          />
          <MultiSelect
            options={typeOptions}
            value={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Filter by device type..."
          />
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search devices..."
          />
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Browser Distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Browser Distribution</h3>
          {devicesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : (
            <DonutChart data={browserChartData} height={250} innerRadius={60} outerRadius={100} />
          )}
        </div>

        {/* OS Distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Operating Systems</h3>
          {devicesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : (
            <DonutChart data={osChartData} height={250} innerRadius={60} outerRadius={100} />
          )}
        </div>

        {/* Device Types */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Device Types</h3>
          {devicesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : (
            <DonutChart
              data={deviceTypeChartData}
              height={250}
              innerRadius={60}
              outerRadius={100}
            />
          )}
        </div>
      </div>

      {/* Screen Resolutions */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">Screen Resolutions</h3>
        {resolutionsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <BarChart
            data={resolutionChartData.slice(0, 10)}
            xKey="name"
            yKey="value"
            height={300}
            horizontal={true}
          />
        )}
      </div>

      {/* Device Capabilities */}
      {capabilities && capabilities.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Feature Support</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {capabilities.map((cap) => (
              <div key={cap.feature} className="p-4 bg-neutral-50 rounded-lg">
                <div className="text-sm text-neutral-600 mb-2">{cap.feature}</div>
                <div className="text-2xl font-bold text-neutral-900">
                  {cap.supportRate.toFixed(1)}%
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={cn(
                      'h-full',
                      cap.supportRate >= 90
                        ? 'bg-success-500'
                        : cap.supportRate >= 70
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    )}
                    style={{ width: `${cap.supportRate}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {cap.supported.toLocaleString()} /{' '}
                  {(cap.supported + cap.notSupported).toLocaleString()} devices
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Details Table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">Device Details</h3>
        {devicesLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <SortableTable
            data={filteredDevices}
            columns={columns}
            defaultSortKey="count"
            defaultSortDirection="desc"
            emptyMessage="No devices match your filters"
          />
        )}
      </div>
    </div>
  );
}

export default DevicesAnalytics;
