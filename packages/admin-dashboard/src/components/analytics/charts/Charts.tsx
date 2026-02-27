/**
 * Recharts wrapper components for analytics
 */

import { memo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number | number[];
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

// ==================== Line Chart ====================

export interface LineChartProps {
  data: (TimeSeriesData | ChartData)[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  curve?: 'monotone' | 'linear';
  className?: string;
}

export const LineChart = memo<LineChartProps>(
  ({
    data,
    xKey,
    yKey,
    color = '#3b82f6',
    height = 300,
    showGrid = true,
    showTooltip = true,
    showLegend = false,
    curve = 'monotone',
    className = '',
  }) => (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsLineChart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={xKey}
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
            }}
          />
        )}
        {showLegend && <Legend />}
        <Line
          type={curve}
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
);

LineChart.displayName = 'LineChart';

// ==================== Bar Chart ====================

export interface BarChartProps {
  data: ChartData[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
}

export const BarChart = memo<BarChartProps>(
  ({
    data,
    xKey,
    yKey,
    color = '#3b82f6',
    height = 300,
    horizontal = false,
    showGrid = true,
    showTooltip = true,
    showLegend = false,
    className = '',
  }) => (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsBarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
        <XAxis
          dataKey={xKey}
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
            }}
          />
        )}
        {showLegend && <Legend />}
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 4]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
);

BarChart.displayName = 'BarChart';

// ==================== Donut/Pie Chart ====================

export interface DonutChartProps {
  data: ChartData[];
  dataKey?: string;
  nameKey?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  colors?: string[];
  className?: string;
}

const defaultColors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export const DonutChart = memo<DonutChartProps>(
  ({
    data,
    dataKey = 'value',
    nameKey = 'name',
    height = 300,
    innerRadius = 60,
    outerRadius = 100,
    showTooltip = true,
    showLegend = false,
    colors = defaultColors,
    className = '',
  }) => (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={() => ''}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry) => (
            <Cell
              key={`cell-${entry.name || entry.value}`}
              fill={colors[data.indexOf(entry) % colors.length]}
              stroke="none"
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f1f5f9',
            }}
          />
        )}
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  )
);

DonutChart.displayName = 'DonutChart';

// ==================== Gauge Chart ====================

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  thresholds?: { value: number; color: string }[];
  height?: number;
  width?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const GaugeChart = memo<GaugeChartProps>(
  ({
    value,
    min = 0,
    max = 100,
    thresholds = [
      { value: 50, color: '#22c55e' }, // good
      { value: 75, color: '#f59e0b' }, // needs improvement
      { value: 100, color: '#ef4444' }, // poor
    ],
    height = 120,
    width = 200,
    label,
    showValue = true,
    className = '',
  }) => {
    // Determine color based on value
    const getColor = () => {
      for (const threshold of thresholds) {
        if (value <= threshold.value) return threshold.color;
      }
      return thresholds[thresholds.length - 1].color;
    };

    const color = getColor();
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 100), 100);

    return (
      <div className={cn('flex flex-col items-center', className)}>
        <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
          <svg viewBox="0 0 200 120" width={width} height={height}>
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 1 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={20}
            />
            {/* Value arc */}
            <path
              d="M 20 100 A 80 80 0 1 1 180 100"
              fill="none"
              stroke={color}
              strokeWidth={20}
              strokeDasharray={`${percentage * 502.4} 502.4`}
              strokeDashoffset="125.6"
              style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: `${Math.min(width / 5, 32)}px` }}
          >
            {showValue && (
              <span className="font-bold" style={{ color }}>
                {Math.round(value)}
              </span>
            )}
          </div>
        </div>
        {label && <span className="text-sm text-gray-600 mt-2">{label}</span>}
      </div>
    );
  }
);

GaugeChart.displayName = 'GaugeChart';

// ==================== Sparkline ====================

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export const Sparkline = memo<SparklineProps>(
  ({ data, width = 100, height = 30, color = '#3b82f6', showArea = false, className = '' }) => {
    if (data.length === 0) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data
      .map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg width={width} height={height} className={className}>
        {showArea && <polygon points={areaPoints} fill={color} fillOpacity={0.2} />}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
);

Sparkline.displayName = 'Sparkline';

// ==================== Heatmap ====================

export interface HeatmapProps {
  data: HeatmapData[];
  height?: number;
  cellSize?: number;
  colorScale?: { value: number; color: string }[];
  showLabels?: boolean;
  className?: string;
}

const defaultColorScale = [
  { value: 0, color: '#f0f9ff' },
  { value: 25, color: '#bae6fd' },
  { value: 50, color: '#7dd3fc' },
  { value: 75, color: '#38bdf8' },
  { value: 100, color: '#0284c7' },
];

export const Heatmap = memo<HeatmapProps>(
  ({
    data,
    height: _height = 200,
    cellSize = 40,
    colorScale = defaultColorScale,
    showLabels = true,
    className = '',
  }) => {
    const getColor = (value: number) => {
      for (let i = colorScale.length - 1; i >= 0; i--) {
        if (value >= colorScale[i].value) return colorScale[i].color;
      }
      return colorScale[0].color;
    };

    const maxValue = Math.max(...data.map((d) => d.value), 1);

    // Group by day
    const days = [...new Set(data.map((d) => d.day))];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className={className}>
        <div className="flex">
          {/* Y-axis labels */}
          {showLabels && (
            <div
              className="flex flex-col justify-between mr-2 py-1"
              style={{ height: `${hours.length * cellSize}px` }}
            >
              {hours.map((hour) => (
                <div key={hour} className="flex items-center" style={{ height: `${cellSize}px` }}>
                  <span className="text-xs text-gray-500">{hour}:00</span>
                </div>
              ))}
            </div>
          )}

          {/* Heatmap cells */}
          <div className="flex flex-col">
            {days.map((day) => (
              <div key={day} className="flex">
                <div className="flex flex-col">
                  {hours.map((hour) => {
                    const cellData = data.find((d) => d.day === day && d.hour === hour);
                    const value = cellData?.value || 0;
                    return (
                      <div
                        key={hour}
                        title={`${day} ${hour}:00 - ${value}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColor(value),
                        }}
                        className="m-px rounded-sm"
                      />
                    );
                  })}
                </div>
                {showLabels && (
                  <div className="text-xs text-gray-500 text-center truncate w-full">{day}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Color scale legend */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-gray-500">0</span>
          {colorScale.map(({ color, value }) => (
            <div
              key={value}
              className="h-2 rounded-sm"
              style={{ width: cellSize, backgroundColor: color }}
            />
          ))}
          <span className="text-xs text-gray-500">{maxValue}</span>
        </div>
      </div>
    );
  }
);

Heatmap.displayName = 'Heatmap';

// ==================== Area Chart ====================

export interface AreaChartProps {
  data: (TimeSeriesData | ChartData)[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  className?: string;
}

export const AreaChart = memo<AreaChartProps>(
  ({
    data,
    xKey,
    yKey,
    color = '#3b82f6',
    height = 300,
    showGrid = true,
    showTooltip = true,
    showLegend = false,
    className = '',
  }) => (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis
            dataKey={xKey}
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f1f5f9',
              }}
            />
          )}
          {showLegend && <Legend />}
          <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.3} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
);

AreaChart.displayName = 'AreaChart';
