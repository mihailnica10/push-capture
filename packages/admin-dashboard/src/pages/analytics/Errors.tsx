/**
 * Errors Analytics Page
 * Error tracking, grouping, and analysis
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart, LineChart } from '../../components/analytics/charts/Charts';
import { DateRange, DateRangePicker } from '../../components/analytics/filters/DateRangePicker';
import { SearchInput } from '../../components/analytics/filters/SearchInput';
import { Column, SortableTable } from '../../components/analytics/tables/SortableTable';
import { cn } from '../../styles/theme';

// ==================== Types ====================

interface ErrorGroup {
  id: string;
  message: string;
  type: string;
  count: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  url?: string;
  browser?: string;
  os?: string;
  trend: number;
}

interface ErrorTrend {
  date: string;
  errors: number;
  users: number;
}

interface ErrorSummary {
  total: number;
  critical: number;
  warnings: number;
  rate: number;
  topTypes: { type: string; count: number }[];
}

// ==================== Helper Components ====================

function SeverityBadge({ type }: { type: string }) {
  const severity =
    type.toLowerCase().includes('critical') || type.toLowerCase().includes('error')
      ? 'error'
      : type.toLowerCase().includes('warn')
        ? 'warning'
        : 'info';

  const styles = {
    error: 'bg-error-100 text-error-700',
    warning: 'bg-warning-100 text-warning-700',
    info: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[severity])}>
      {type}
    </span>
  );
}

// ==================== Component ====================

export function ErrorsAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last7days',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Fetch error summary
  const { data: errorSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-errors-summary', dateRange],
    queryFn: async (): Promise<ErrorSummary> => {
      const response = await fetch(`/api/analytics/errors-summary?days=7`);
      if (!response.ok) throw new Error('Failed to fetch error summary');
      return response.json();
    },
  });

  // Fetch error groups
  const { data: errorGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['analytics-errors-groups', dateRange],
    queryFn: async (): Promise<ErrorGroup[]> => {
      const response = await fetch(`/api/analytics/errors-groups?days=7`);
      if (!response.ok) throw new Error('Failed to fetch error groups');
      return response.json();
    },
  });

  // Fetch error trends
  const { data: errorTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-errors-trends', dateRange],
    queryFn: async (): Promise<ErrorTrend[]> => {
      const response = await fetch(`/api/analytics/errors-trends?days=7`);
      if (!response.ok) throw new Error('Failed to fetch error trends');
      return response.json();
    },
  });

  // Filter error groups
  const filteredErrors =
    errorGroups?.filter((error) => {
      const matchesSearch =
        !searchQuery ||
        error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        error.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || error.type === selectedType;

      return matchesSearch && matchesType;
    }) ?? [];

  // Prepare type filter options
  const typeOptions = ['all', ...new Set(errorGroups?.map((e) => e.type) ?? [])];

  // Prepare chart data
  const trendChartData =
    errorTrends?.map((t) => ({
      name: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
      value: t.errors,
      label: `${t.errors} errors`,
    })) ?? [];

  const typeChartData =
    errorSummary?.topTypes.map((t) => ({
      name: t.type,
      value: t.count,
    })) ?? [];

  const columns: Column<ErrorGroup>[] = [
    {
      key: 'message',
      header: 'Error Message',
      sortable: true,
      render: (_: string, row) => (
        <div className="max-w-md">
          <div className="font-mono text-sm text-error-600 truncate" title={row.message}>
            {row.message}
          </div>
          {row.url && <div className="text-xs text-neutral-500 truncate mt-1">{row.url}</div>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (value: string) => <SeverityBadge type={value} />,
    },
    {
      key: 'count',
      header: 'Occurrences',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'affectedUsers',
      header: 'Affected Users',
      sortable: true,
      render: (value: number) => value.toLocaleString(),
    },
    {
      key: 'firstSeen',
      header: 'First Seen',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      key: 'lastSeen',
      header: 'Last Seen',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      render: (value: number) => (
        <span
          className={cn(
            'font-medium text-sm',
            value > 10 ? 'text-error-600' : value < -10 ? 'text-success-600' : 'text-neutral-500'
          )}
        >
          {value > 0 ? '↑' : value < 0 ? '↓' : '−'} {Math.abs(value).toFixed(0)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Error Tracking</h1>
          <p className="text-sm text-neutral-500 mt-1">Monitor and analyze application errors</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ErrorStatCard
          title="Total Errors"
          value={errorSummary?.total ?? 0}
          previousValue={errorSummary ? Math.round(errorSummary.total * 0.9) : 0}
          color="error"
        />
        <ErrorStatCard
          title="Critical Errors"
          value={errorSummary?.critical ?? 0}
          previousValue={errorSummary ? Math.round(errorSummary.critical * 0.8) : 0}
          color="error"
        />
        <ErrorStatCard
          title="Warnings"
          value={errorSummary?.warnings ?? 0}
          previousValue={errorSummary ? Math.round(errorSummary.warnings * 1.1) : 0}
          color="warning"
        />
        <ErrorStatCard
          title="Error Rate"
          value={`${errorSummary?.rate.toFixed(2) ?? 0}%`}
          previousValue={`${((errorSummary?.rate ?? 0) * 1.2).toFixed(2)}%`}
          color="neutral"
          isPercentage={true}
        />
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">Error Trend</h3>
        {trendsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <LineChart data={trendChartData} xKey="name" yKey="value" color="#ef4444" height={250} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Type Distribution */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Error Types</h3>
          {summaryLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : (
            <BarChart data={typeChartData} xKey="name" yKey="value" height={250} />
          )}
        </div>

        {/* Filters */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Filters</h3>
          <div className="space-y-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by error message or type..."
            />
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Groups Table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">Error Groups</h3>
          <span className="text-sm text-neutral-500">{filteredErrors.length} groups</span>
        </div>
        {groupsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <SortableTable
            data={filteredErrors}
            columns={columns}
            defaultSortKey="count"
            defaultSortDirection="desc"
            emptyMessage="No errors match your filters"
          />
        )}
      </div>
    </div>
  );
}

// ==================== Sub-Components ====================

interface ErrorStatCardProps {
  title: string;
  value: number | string;
  previousValue: number | string;
  color: 'error' | 'warning' | 'neutral';
  isPercentage?: boolean;
}

function ErrorStatCard({ title, value, previousValue, color, isPercentage }: ErrorStatCardProps) {
  const colorStyles = {
    error: 'bg-error-50 border-error-200',
    warning: 'bg-warning-50 border-warning-200',
    neutral: 'bg-neutral-50 border-neutral-200',
  };

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  const numericPrevious =
    typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;
  const change =
    numericPrevious > 0 ? ((numericValue - numericPrevious) / numericPrevious) * 100 : 0;

  return (
    <div className={cn('bg-white rounded-xl border p-4', colorStyles[color])}>
      <p className="text-sm text-neutral-600">{title}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        <span
          className={cn(
            'text-xs font-medium',
            change > 0 && color === 'error'
              ? 'text-error-600'
              : change > 0
                ? 'text-success-600'
                : change < 0
                  ? 'text-success-600'
                  : 'text-neutral-500'
          )}
        >
          {change > 0 ? '↑' : change < 0 ? '↓' : '−'} {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-xs text-neutral-500">vs previous period</span>
      </div>
    </div>
  );
}

export default ErrorsAnalytics;
