/**
 * Performance Analytics Page
 * Core Web Vitals and page performance metrics
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DonutChart, GaugeChart } from '../../components/analytics/charts/Charts';
import { DateRange, DateRangePicker } from '../../components/analytics/filters/DateRangePicker';
import { Column, SortableTable } from '../../components/analytics/tables/SortableTable';
import { cn } from '../../styles/theme';

// ==================== Types ====================

interface WebVitalsSummary {
  lcp: { avg: number; good: number; needsImprovement: number; poor: number };
  fid: { avg: number; good: number; needsImprovement: number; poor: number };
  cls: { avg: number; good: number; needsImprovement: number; poor: number };
  fcp: { avg: number };
  ttfb: { avg: number };
  inp: { avg: number };
}

interface PagePerformance {
  id: string;
  url: string;
  path: string;
  lcp: number;
  fid: number;
  cls: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  samples: number;
}

interface VitalDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// ==================== Constants ====================

const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
  inp: { good: 200, poor: 500 },
};

const RATING_COLORS: Record<string, string> = {
  good: '#22c55e',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
};

// ==================== Helper Functions ====================

function getRating(
  value: number,
  metric: keyof typeof CWV_THRESHOLDS
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = CWV_THRESHOLDS[metric];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function formatDuration(value: number, metric: string): string {
  if (metric === 'cls') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function getRatingBadge(rating: string) {
  const styles = {
    good: 'bg-success-100 text-success-700',
    'needs-improvement': 'bg-warning-100 text-warning-700',
    poor: 'bg-error-100 text-error-700',
  };

  return (
    <span
      className={cn(
        'px-2 py-1 rounded-full text-xs font-medium',
        styles[rating as keyof typeof styles]
      )}
    >
      {rating === 'needs-improvement'
        ? 'Needs Improvement'
        : rating.charAt(0).toUpperCase() + rating.slice(1)}
    </span>
  );
}

// ==================== Component ====================

export function PerformanceAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    preset: 'last30days',
  });

  // Fetch Web Vitals summary
  const { data: vitalsSummary, isLoading: vitalsLoading } = useQuery({
    queryKey: ['analytics-web-vitals', dateRange],
    queryFn: async (): Promise<WebVitalsSummary> => {
      const response = await fetch('/api/analytics/web-vitals-summary?days=30');
      if (!response.ok) throw new Error('Failed to fetch Web Vitals');
      return response.json();
    },
  });

  // Fetch page performance data
  const { data: pagePerformance, isLoading: pagesLoading } = useQuery({
    queryKey: ['analytics-page-performance', dateRange],
    queryFn: async (): Promise<PagePerformance[]> => {
      const response = await fetch('/api/analytics/page-performance?days=30');
      if (!response.ok) throw new Error('Failed to fetch page performance');
      return response.json();
    },
  });

  // Prepare distribution chart data
  const lcpDistribution: VitalDistribution[] = vitalsSummary
    ? [
        { name: 'Good', value: vitalsSummary.lcp.good, color: RATING_COLORS.good },
        {
          name: 'Needs Improvement',
          value: vitalsSummary.lcp.needsImprovement,
          color: RATING_COLORS['needs-improvement'],
        },
        { name: 'Poor', value: vitalsSummary.lcp.poor, color: RATING_COLORS.poor },
      ]
    : [];

  const columns: Column<PagePerformance>[] = [
    {
      key: 'path',
      header: 'Page',
      sortable: true,
      render: (_: string, row) => (
        <div className="max-w-xs">
          <div className="truncate text-sm font-medium text-neutral-900" title={row.url}>
            {row.path || row.url}
          </div>
          <div className="text-xs text-neutral-500">{row.samples.toLocaleString()} samples</div>
        </div>
      ),
    },
    {
      key: 'lcp',
      header: 'LCP',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm">
          <div className="font-medium">{formatDuration(value, 'lcp')}</div>
          <div className="mt-1">{getRatingBadge(getRating(value, 'lcp'))}</div>
        </div>
      ),
    },
    {
      key: 'fid',
      header: 'FID',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm">
          <div className="font-medium">{formatDuration(value, 'fid')}</div>
          <div className="mt-1">{getRatingBadge(getRating(value, 'fid'))}</div>
        </div>
      ),
    },
    {
      key: 'cls',
      header: 'CLS',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm">
          <div className="font-medium">{formatDuration(value, 'cls')}</div>
          <div className="mt-1">{getRatingBadge(getRating(value, 'cls'))}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Overall',
      sortable: true,
      render: (_: string, row) => getRatingBadge(row.rating),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Performance Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Core Web Vitals and page performance metrics
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* CWV Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LCP Gauge */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Largest Contentful Paint</h3>
            <span className="text-xs text-neutral-500">Loading performance</span>
          </div>
          {vitalsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : vitalsSummary ? (
            <div className="flex flex-col items-center">
              <GaugeChart
                value={vitalsSummary.lcp.avg}
                min={0}
                max={5000}
                thresholds={[
                  { value: 2500, color: RATING_COLORS.good },
                  { value: 4000, color: RATING_COLORS['needs-improvement'] },
                  { value: 5000, color: RATING_COLORS.poor },
                ]}
                height={140}
                width={200}
              />
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  {Math.round(vitalsSummary.lcp.avg)}ms
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Good: &lt;2.5s · Needs Improvement: 2.5-4s · Poor: &gt;4s
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* FID Gauge */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">First Input Delay</h3>
            <span className="text-xs text-neutral-500">Interactivity</span>
          </div>
          {vitalsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : vitalsSummary ? (
            <div className="flex flex-col items-center">
              <GaugeChart
                value={vitalsSummary.fid.avg}
                min={0}
                max={500}
                thresholds={[
                  { value: 100, color: RATING_COLORS.good },
                  { value: 300, color: RATING_COLORS['needs-improvement'] },
                  { value: 500, color: RATING_COLORS.poor },
                ]}
                height={140}
                width={200}
              />
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  {Math.round(vitalsSummary.fid.avg)}ms
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Good: &lt;100ms · Needs Improvement: 100-300ms · Poor: &gt;300ms
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* CLS Gauge */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Cumulative Layout Shift</h3>
            <span className="text-xs text-neutral-500">Visual stability</span>
          </div>
          {vitalsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : vitalsSummary ? (
            <div className="flex flex-col items-center">
              <GaugeChart
                value={vitalsSummary.cls.avg * 100}
                min={0}
                max={50}
                thresholds={[
                  { value: 10, color: RATING_COLORS.good },
                  { value: 25, color: RATING_COLORS['needs-improvement'] },
                  { value: 50, color: RATING_COLORS.poor },
                ]}
                height={140}
                width={200}
              />
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-neutral-900">
                  {vitalsSummary.cls.avg.toFixed(3)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Good: &lt;0.1 · Needs Improvement: 0.1-0.25 · Poor: &gt;0.25
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">LCP Distribution</h3>
          <DonutChart
            data={lcpDistribution}
            height={250}
            innerRadius={70}
            outerRadius={110}
            showLegend={true}
          />
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="font-semibold text-neutral-900 mb-4">Additional Metrics</h3>
          {vitalsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-neutral-500">Loading...</div>
            </div>
          ) : vitalsSummary ? (
            <div className="space-y-4 mt-4">
              <MetricRow
                label="First Contentful Paint (FCP)"
                value={`${Math.round(vitalsSummary.fcp.avg)}ms`}
              />
              <MetricRow
                label="Time to First Byte (TTFB)"
                value={`${Math.round(vitalsSummary.ttfb.avg)}ms`}
              />
              <MetricRow
                label="Interaction to Next Paint (INP)"
                value={`${Math.round(vitalsSummary.inp.avg)}ms`}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Page Performance Table */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-4">Page Performance</h3>
        {pagesLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <SortableTable
            data={pagePerformance ?? []}
            columns={columns}
            defaultSortKey="lcp"
            defaultSortDirection="desc"
          />
        )}
      </div>
    </div>
  );
}

// ==================== Sub-Components ====================

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  const numValue = parseFloat(value.replace('ms', ''));
  const rating = getRating(numValue, 'fcp' as keyof typeof CWV_THRESHOLDS);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-900">{value}</span>
        {getRatingBadge(rating)}
      </div>
    </div>
  );
}

export default PerformanceAnalytics;
