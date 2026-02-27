/**
 * Analytics Map Component
 * Leaflet wrapper for displaying geographic analytics data
 */

import L from 'leaflet';
import { memo, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../../styles/theme';

// Fix for default marker icons in Leaflet with webpack
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ==================== Types ====================

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  country: string;
  countryCode: string;
  city?: string;
  count: number;
  label?: string;
}

export interface AnalyticsMapProps {
  markers?: MapMarker[];
  height?: number;
  zoom?: number;
  center?: [number, number];
  showHeatmap?: boolean;
  clusterMarkers?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

// ==================== Custom Icons ====================

const createPulseIcon = (color: string = '#3b82f6'): L.DivIcon => {
  return L.divIcon({
    className: 'pulse-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        background: ${color}40;
        border-radius: 50%;
        animation: pulse 2s infinite;
        top: -8px;
        left: -8px;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createClusterIcon = (count: number): L.DivIcon => {
  const size = Math.min(Math.max(30 + Math.log2(count) * 5, 30), 60);
  const color = count > 100 ? '#ef4444' : count > 50 ? '#f59e0b' : '#3b82f6';

  return L.divIcon({
    className: 'cluster-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(12, size / 2.5)}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ==================== Map Component ====================

export const AnalyticsMap = memo<AnalyticsMapProps>(
  ({
    markers = [],
    height = 400,
    zoom = 2,
    center = [20, 0],
    clusterMarkers = true,
    onMarkerClick,
    className = '',
  }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const [isReady, setIsReady] = useState(false);

    // Initialize map
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsReady(true);

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, [center, zoom]);

    // Update markers
    useEffect(() => {
      if (!isReady || !mapRef.current) return;

      const map = mapRef.current;

      // Clear existing markers
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];

      if (markers.length === 0) return;

      // Group markers for clustering if enabled
      if (clusterMarkers && markers.length > 50) {
        const grouped = new Map<string, MapMarker>();

        markers.forEach((marker) => {
          // Round to 1 decimal place for grouping (approximately 10km precision)
          const key = `${marker.lat.toFixed(1)},${marker.lon.toFixed(1)}`;
          const existing = grouped.get(key);

          if (existing) {
            grouped.set(key, {
              ...existing,
              count: existing.count + marker.count,
              id: key,
            });
          } else {
            grouped.set(key, marker);
          }
        });

        // Add cluster markers
        grouped.forEach((marker) => {
          const icon = marker.count > 10 ? createClusterIcon(marker.count) : createPulseIcon();

          const mapMarker = L.marker([marker.lat, marker.lon], { icon }).addTo(map);

          const popupContent = `
          <div style="min-width: 150px;">
            <strong>${marker.city || marker.country}</strong><br>
            ${marker.city ? `${marker.city}, ` : ''}${marker.country}<br>
            <strong>${marker.count.toLocaleString()}</strong> sessions
          </div>
        `;

          mapMarker.bindPopup(popupContent);

          if (onMarkerClick) {
            mapMarker.on('click', () => onMarkerClick(marker));
          }

          markersRef.current.push(mapMarker);
        });
      } else {
        // Add individual markers
        markers.forEach((marker) => {
          const icon = createPulseIcon();
          const mapMarker = L.marker([marker.lat, marker.lon], { icon }).addTo(map);

          const popupContent = `
          <div style="min-width: 150px;">
            <strong>${marker.city || marker.country}</strong><br>
            ${marker.city ? `${marker.city}, ` : ''}${marker.country}<br>
            <strong>${marker.count.toLocaleString()}</strong> sessions
          </div>
        `;

          mapMarker.bindPopup(popupContent);

          if (onMarkerClick) {
            mapMarker.on('click', () => onMarkerClick(marker));
          }

          markersRef.current.push(mapMarker);
        });
      }

      // Fit bounds to show all markers
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number]));
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
      }
    }, [isReady, markers, clusterMarkers, onMarkerClick]);

    return (
      <div
        ref={mapContainerRef}
        className={cn('rounded-lg overflow-hidden shadow-sm', className)}
        style={{ height: `${height}px` }}
      />
    );
  }
);

AnalyticsMap.displayName = 'AnalyticsMap';

export default AnalyticsMap;
