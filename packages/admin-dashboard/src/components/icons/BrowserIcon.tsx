/**
 * Browser Icon Component
 * Displays SVG icons for different browsers
 */

import { memo } from 'react';

export interface BrowserIconProps {
  browser: string;
  size?: number;
  className?: string;
}

const BrowserIcon = memo(({ browser, size = 24, className = '' }: BrowserIconProps) => {
  const normalizedBrowser = browser.toLowerCase();

  const icons: Record<string, JSX.Element> = {
    chrome: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#4285F4"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <path fill="#34A853" d="M12 2v20c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        <path fill="#FBBC05" d="M12 2v20c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        <path fill="#EA4335" d="M12 2v20c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        <circle fill="#FFF" cx="12" cy="12" r="3" />
      </svg>
    ),
    firefox: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#FF7139"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <path fill="#FFF" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
        <circle fill="#FF7139" cx="12" cy="12" r="2" />
      </svg>
    ),
    safari: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#1D6ED8"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <circle fill="#FFF" cx="12" cy="8" r="1.5" />
        <path
          fill="#FFF"
          d="M12 11c-1.5 0-2.5 2-2.5 3.5S10.5 18 12 18s2.5-3 2.5-5.5S13.5 11 12 11z"
        />
      </svg>
    ),
    edge: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#0078D7"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <path fill="#50E6FF" d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
        <circle fill="#FFF" cx="12" cy="12" r="2" />
      </svg>
    ),
    opera: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#FF1B2D"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <path fill="#FFF" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
        <circle fill="#FF1B2D" cx="12" cy="12" r="1" />
      </svg>
    ),
    ie: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#00A4EF"
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        />
        <text x="12" y="16" textAnchor="middle" fill="#FFF" fontSize="8" fontWeight="bold">
          e
        </text>
      </svg>
    ),
    android: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#3DDC84"
          d="M6 18c0 .55.45 1 1 1h2v3c0 .55.45 1 1 1h2v-3c0-.55-.45-1-1-1H7c-.55 0-1-.45-1-1v-3zm4 3c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1h2v-2c0-.55-.45-1-1-1h-2v-2zm5-4V9c0-.55-.45-1-1-1h-2V6c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-3zm2-8c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v3h2v2c0 .55.45 1 1 1h2v-2c0-.55-.45-1-1-1h-2V9z"
        />
      </svg>
    ),
    ios: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="7" y="2" width="10" height="20" rx="2" fill="#333" />
        <rect x="9" y="4" width="6" height="12" rx="1" fill="#1a1a1a" />
        <circle cx="12" cy="18" r="1" fill="#555" />
      </svg>
    ),
  };

  const icon = icons[normalizedBrowser];

  if (icon) {
    return icon;
  }

  // Default fallback icon
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="10" fill="#94a3b8" />
      <circle cx="12" cy="8" r="1.5" fill="#fff" />
      <path d="M9 12h6M12 9v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
});

BrowserIcon.displayName = 'BrowserIcon';

export default BrowserIcon;
