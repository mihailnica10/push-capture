/**
 * Device Type Icon Component
 * Displays SVG icons for different device types
 */

import { memo } from 'react';

export interface DeviceIconProps {
  device: 'mobile' | 'tablet' | 'desktop' | 'wearable' | 'smarttv' | string;
  size?: number;
  className?: string;
}

const DeviceIcon = memo(({ device, size = 24, className = '' }: DeviceIconProps) => {
  const normalizedDevice = device.toLowerCase();

  const icons: Record<string, JSX.Element> = {
    mobile: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="8" y="2" width="8" height="14" rx="1" fill="#64748b" />
        <circle cx="12" cy="17" r="1" fill="#64748b" />
        <rect x="11" y="17" width="2" height="1" rx="0.5" fill="#64748b" />
      </svg>
    ),
    tablet: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="4" y="5" width="16" height="10" rx="1" fill="#64748b" />
        <circle cx="12" cy="17" r="1" fill="#64748b" />
      </svg>
    ),
    desktop: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="2" y="4" width="20" height="12" rx="1" fill="#64748b" />
        <rect x="10" y="17" width="4" height="3" fill="#64748b" />
        <rect x="6" y="20" width="12" height="1" rx="0.5" fill="#64748b" />
        <rect x="4" y="6" width="16" height="8" fill="#e0e7ff" />
      </svg>
    ),
    wearable: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="9" y="6" width="6" height="14" rx="3" fill="#64748b" />
        <path stroke="#64748b" strokeWidth="2" strokeLinecap="round" d="M12 4v2" />
        <circle cx="12" cy="21" r="0.5" fill="#64748b" />
      </svg>
    ),
    smarttv: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="3" y="5" width="18" height="12" rx="1" fill="#64748b" />
        <rect x="7" y="7" width="10" height="8" fill="#e0e7ff" />
        <rect x="10" y="18" width="4" height="3" fill="#64748b" />
      </svg>
    ),
  };

  const icon = icons[normalizedDevice];

  if (icon) {
    return icon;
  }

  // Default fallback
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <rect x="6" y="8" width="12" height="8" rx="1" fill="#94a3b8" />
    </svg>
  );
});

DeviceIcon.displayName = 'DeviceIcon';

export default DeviceIcon;
