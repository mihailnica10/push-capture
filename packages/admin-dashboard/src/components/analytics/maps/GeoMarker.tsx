/**
 * GeoMarker Component
 * Custom marker for map with popup styling
 */

import { memo } from 'react';
import { getCountryFlag } from '../../../services/geolocation';
import { cn } from '../../../styles/theme';

// ==================== Types ====================

export interface GeoMarkerProps {
  country: string;
  countryCode: string;
  city?: string;
  count: number;
  trend?: number;
  className?: string;
}

// ==================== Component ====================

export const GeoMarker = memo<GeoMarkerProps>(
  ({ country, countryCode, city, count, trend, className = '' }) => {
    const trendColor =
      trend && trend > 0
        ? 'text-success-600'
        : trend && trend < 0
          ? 'text-error-600'
          : 'text-neutral-500';
    const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '−';

    return (
      <div className={cn('p-3', className)}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getCountryFlag(countryCode)}</span>
          <div>
            <div className="font-medium text-sm">{city || country}</div>
            {city && country !== city && <div className="text-xs text-neutral-500">{country}</div>}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">{count.toLocaleString()}</span>
          {trend !== undefined && (
            <span className={cn('text-sm font-medium', trendColor)}>
              {trendIcon} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);

GeoMarker.displayName = 'GeoMarker';

export default GeoMarker;
