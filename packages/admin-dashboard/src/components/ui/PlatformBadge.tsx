/**
 * Platform Badge Component
 * Combined badge showing browser, OS, and device type icons
 */

import { memo } from 'react';
import { cn } from '../../styles/theme';
import BrowserIcon from '../icons/BrowserIcon';
import DeviceIcon from '../icons/DeviceIcon';
import OSIcon from '../icons/OSIcon';

export interface PlatformBadgeProps {
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  device?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 14, text: 'xs' },
  md: { icon: 18, text: 'sm' },
  lg: { icon: 20, text: 'base' },
};

const PlatformBadge = memo<PlatformBadgeProps>(
  ({
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    size = 'md',
    showLabels = true,
    className = '',
  }) => {
    const { icon: iconSize, text: textSize } = sizeMap[size];

    // Get platform color
    const getPlatformColor = () => {
      if (os?.toLowerCase().includes('ios') || browser?.toLowerCase().includes('safari')) {
        return 'bg-blue-100 text-blue-700 border-blue-200';
      }
      if (os?.toLowerCase().includes('android')) {
        return 'bg-green-100 text-green-700 border-green-200';
      }
      if (browser?.toLowerCase().includes('chrome')) {
        return 'bg-orange-100 text-orange-700 border-orange-200';
      }
      if (browser?.toLowerCase().includes('firefox')) {
        return 'bg-purple-100 text-purple-700 border-purple-200';
      }
      return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const platformColor = getPlatformColor();

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
          platformColor,
          className
        )}
      >
        {/* Browser Icon */}
        {browser && (
          <div className="flex items-center gap-1">
            <BrowserIcon browser={browser} size={iconSize} />
            {showLabels && (
              <span className={`text-${textSize} font-medium`}>
                {browser}
                {browserVersion && <span className="opacity-60 ml-0.5">{browserVersion}</span>}
              </span>
            )}
          </div>
        )}

        {/* Separator */}
        {browser && os && <span className="w-px h-3 bg-current opacity-30" />}

        {/* OS Icon */}
        {os && (
          <div className="flex items-center gap-1">
            <OSIcon os={os} size={iconSize} />
            {showLabels && (
              <span className={`text-${textSize} font-medium`}>
                {os}
                {osVersion && <span className="opacity-60 ml-0.5">{osVersion}</span>}
              </span>
            )}
          </div>
        )}

        {/* Separator */}
        {os && device && <span className="w-px h-3 bg-current opacity-30" />}

        {/* Device Icon */}
        {device && (
          <div className="flex items-center gap-1">
            <DeviceIcon device={device} size={iconSize} />
            {showLabels && (
              <span className={`text-${textSize} font-medium capitalize`}>{device}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

PlatformBadge.displayName = 'PlatformBadge';

export default PlatformBadge;
