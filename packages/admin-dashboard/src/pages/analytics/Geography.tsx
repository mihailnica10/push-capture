/**
 * Geography Analytics Page
 * Displays geographic distribution of users with map visualization
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DateRange, DateRangePicker } from '../../components/analytics/filters/DateRangePicker';
import { AnalyticsMap } from '../../components/analytics/maps/AnalyticsMap';
import { SortableTable } from '../../components/analytics/tables/SortableTable';
import { getCountryFlag } from '../../services/geolocation';
import { cn } from '../../styles/theme';

interface CountryData {
  country: string;
  countryCode: string;
  sessions: number;
  pageViews: number;
  avgDuration: number;
  trend: number;
}

interface CityData {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  sessions: number;
}

export function GeographyAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last30days',
  });

  // Fetch geographic distribution data
  const { data: countryData, isLoading: countriesLoading } = useQuery({
    queryKey: ['analytics-geo-countries', dateRange],
    queryFn: async (): Promise<CountryData[]> => {
      // This would be a real API call
      const response = await fetch(`/api/analytics/geo-distribution?days=30`);
      if (!response.ok) throw new Error('Failed to fetch country data');
      return response.json();
    },
  });

  const { data: cityData, isLoading: citiesLoading } = useQuery({
    queryKey: ['analytics-geo-cities', dateRange],
    queryFn: async (): Promise<CityData[]> => {
      const response = await fetch(`/api/analytics/geo-distribution?days=30&level=city`);
      if (!response.ok) throw new Error('Failed to fetch city data');
      return response.json();
    },
  });

  // Prepare map markers from city data
  const mapMarkers =
    cityData?.map((city) => ({
      id: `${city.city}-${city.country}`,
      lat: city.lat,
      lon: city.lon,
      country: city.country,
      countryCode: city.countryCode,
      city: city.city,
      count: city.sessions,
    })) ?? [];

  const countryColumns = [
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      render: (_: string, row: CountryData) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{getCountryFlag(row.countryCode)}</span>
          <span className="font-medium">{row.country}</span>
        </div>
      ),
    },
    {
      key: 'sessions',
      header: 'Sessions',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'pageViews',
      header: 'Page Views',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'avgDuration',
      header: 'Avg Duration',
      sortable: true,
      render: (value: number) => `${Math.round(value / 60)}m ${Math.round(value % 60)}s`,
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      render: (value: number) => (
        <span
          className={cn(
            'font-medium',
            value > 0 ? 'text-success-600' : value < 0 ? 'text-error-600' : 'text-neutral-500'
          )}
        >
          {value > 0 ? '↑' : value < 0 ? '↓' : '−'} {Math.abs(value).toFixed(1)}%
        </span>
      ),
    },
  ];

  const totalSessions = countryData?.reduce((sum, c) => sum + c.sessions, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Geographic Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Understand where your users are located</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Countries" value={countryData?.length ?? 0} icon="🌍" />
        <StatCard
          title="Top Country"
          value={countryData?.[0]?.country ?? 'N/A'}
          icon={getCountryFlag(countryData?.[0]?.countryCode ?? '')}
        />
        <StatCard title="Total Sessions" value={totalSessions.toLocaleString()} icon="👥" />
        <StatCard title="Active Cities" value={cityData?.length ?? 0} icon="🏙️" />
      </div>

      {/* World Map */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Global Distribution</h2>
        {citiesLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-neutral-500">Loading map...</div>
          </div>
        ) : (
          <AnalyticsMap markers={mapMarkers} height={400} clusterMarkers={true} />
        )}
      </div>

      {/* Country Breakdown Table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Country Breakdown</h2>
        {countriesLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <SortableTable
            data={countryData ?? []}
            columns={countryColumns}
            defaultSortKey="sessions"
            defaultSortDirection="desc"
          />
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default GeographyAnalytics;
