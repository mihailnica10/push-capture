/**
 * OS Icon Component
 * Displays SVG icons for different operating systems
 */

import { memo } from 'react';

export interface OSIconProps {
  os: string;
  size?: number;
  className?: string;
}

const OSIcon = memo(({ os, size = 24, className = '' }: OSIconProps) => {
  const normalizedOS = os.toLowerCase();

  const icons: Record<string, JSX.Element> = {
    windows: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#0078D7"
          d="M0 3.449L9.75 2.1v9.45l-4.15 3.8L0 3.449zm11.25 0L24 3.449v9.45l-4.15 3.8L11.25 11.55zM0 12.55l5.6 4.6L9.75 21.9v8.45L0 12.55zm11.25 0l5.6 4.6L24 12.55v17.9l-12.75-7.9z"
        />
      </svg>
    ),
    mac: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#333"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        />
        <path fill="#FFF" d="M12 4c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z" />
        <circle fill="#333" cx="8.5" cy="9.5" r="1" />
        <circle fill="#333" cx="15.5" cy="9.5" r="1" />
        <circle fill="#333" cx="12" cy="15.5" r="1" />
      </svg>
    ),
    macos: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#333"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        />
        <path fill="#FFF" d="M12 4c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z" />
        <circle fill="#333" cx="8.5" cy="9.5" r="1" />
        <circle fill="#333" cx="15.5" cy="9.5" r="1" />
        <circle fill="#333" cx="12" cy="15.5" r="1" />
      </svg>
    ),
    linux: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#333"
          d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        />
        <path fill="#FFF" d="M12 4c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z" />
        <path fill="#333" d="M10 8h4v8h-4z" />
        <path fill="#333" d="M8 14h8v2H8z" />
      </svg>
    ),
    android: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <path
          fill="#3DDC84"
          d="M17.523 15.3414c-.5511 0-.9982.4466-.9982.9965v.9965h1.9965v-1.993c0-1.1049-.8952-1.9965-1.9965-1.9965-.5511 0-.9982.4466-.9982.9965v3.9895h1.9965v-2.9921c0-1.1049.8952-1.9965 1.9965-1.9965zM6.477 15.3414c-.5511 0-.9982.4466-.9982.9965v.9965h1.9965v-1.993c0-1.1049-.8952-1.9965-1.9965-1.9965-.5511 0-.9982.4466-.9982.9965v3.9895h1.9965v-2.9921c0-1.1049.8952-1.9965 1.9965-1.9965z"
        />
        <path
          fill="#3DDC84"
          d="M12 0C5.373 0 1 4.373 1 9.772v4.457c0 5.397 4.373 9.772 11 9.772s11-4.374 11-9.772V9.772C23 4.373 18.627 0 12 0z"
        />
        <circle fill="#FFF" cx="9" cy="10" r="1.5" />
        <circle fill="#FFF" cx="15" cy="10" r="1.5" />
        <path fill="#FFF" d="M12 16c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
      </svg>
    ),
    ios: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <rect x="6" y="1" width="12" height="22" rx="3" fill="#333" />
        <rect x="8" y="3" width="8" height="14" rx="1" fill="#1a1a1a" />
        <circle cx="12" cy="20" r="1.5" fill="#555" />
      </svg>
    ),
    unix: (
      <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
        <circle cx="12" cy="12" r="10" fill="#333" />
        <path fill="#FFF" d="M8 12h8M12 8v8" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  const icon = icons[normalizedOS];

  if (icon) {
    return icon;
  }

  // Default fallback
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="10" fill="#94a3b8" />
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
        OS
      </text>
    </svg>
  );
});

OSIcon.displayName = 'OSIcon';

export default OSIcon;
