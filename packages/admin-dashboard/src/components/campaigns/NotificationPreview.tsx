import { faBell, faDesktop, faMobileScreen, faTablet } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface NotificationPreviewProps {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string }>;
  platform?: 'ios' | 'android' | 'desktop' | 'tablet';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

const getPlatformIcon = (platform?: string, deviceType?: string) => {
  if (deviceType === 'mobile' || platform === 'ios' || platform === 'android') {
    return faMobileScreen;
  }
  if (deviceType === 'tablet' || platform === 'tablet') {
    return faTablet;
  }
  return faDesktop;
};

export function NotificationPreview({
  title,
  body,
  icon,
  image,
  badge,
  actions = [],
  platform,
  deviceType,
}: NotificationPreviewProps) {
  const deviceIcon = getPlatformIcon(platform, deviceType);
  const isMobile = deviceType === 'mobile' || platform === 'ios' || platform === 'android';
  const isIOS = platform === 'ios';

  // iOS has tighter limits
  const titlePreview = title.length > 30 ? `${title.substring(0, 30)}...` : title;
  const bodyPreview =
    body && body.length > (isIOS ? 100 : 120) ? `${body.substring(0, isIOS ? 100 : 120)}...` : body;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <FontAwesomeIcon icon={deviceIcon} className="text-gray-400" />
        <span className="font-medium">
          {deviceType || 'desktop'} {platform && `(${platform})`}
        </span>
        {isIOS && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Safari limits apply</span>
        )}
      </div>

      {/* Notification Preview */}
      <div className="flex justify-center">
        <div
          className={`
            relative overflow-hidden rounded-lg shadow-lg border-2 border-gray-200
            ${isMobile ? 'w-80' : 'w-96'}
          `}
          style={{
            backgroundColor: isMobile ? '#ffffff' : '#f3f4f6',
            minHeight: image ? '200px' : 'auto',
          }}
        >
          {/* Status Bar (for mobile preview) */}
          {isMobile && (
            <div className="bg-gray-900 text-white px-3 py-1 flex justify-between items-center text-[10px]">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faBell} className="text-[8px]" />
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Notification Header */}
          <div className="flex items-start gap-3 p-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 overflow-hidden">
                {icon ? (
                  <img src={icon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faBell} className="text-gray-400 text-lg" />
                )}
              </div>
              {/* Badge */}
              {badge && (
                <div className="absolute top-3 left-3">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="font-semibold text-gray-900 text-sm truncate">
                {titlePreview || 'Notification Title'}
              </div>

              {/* Body */}
              {bodyPreview && (
                <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{bodyPreview}</div>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-gray-400 mt-1">now</div>
            </div>
          </div>

          {/* Image */}
          {image && (
            <div className="px-3 pb-2">
              <img
                src={image}
                alt=""
                className="w-full h-32 object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && !isIOS && (
            <div className="flex border-t border-gray-200 divide-x divide-gray-200">
              {actions.slice(0, 2).map((action) => (
                <button
                  key={action.action}
                  type="button"
                  className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-gray-100 transition-colors"
                >
                  {action.title}
                </button>
              ))}
            </div>
          )}

          {/* iOS single action */}
          {actions && actions.length > 0 && isIOS && (
            <div className="px-3 py-2 border-t border-gray-200 text-center">
              <button type="button" className="text-sm font-medium text-blue-600">
                {actions[0].title}
              </button>
            </div>
          )}

          {/* App Name (for desktop) */}
          {!isMobile && (
            <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">Push Capture</span>
              <div className="flex gap-1">
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                <button type="button" className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Character Counts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Title:</span>
          <span
            className={
              title.length > (isIOS ? 30 : 50) ? 'text-red-600 font-medium' : 'text-gray-900'
            }
          >
            {title.length}/{isIOS ? 30 : 50}
          </span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Body:</span>
          <span
            className={
              (body?.length || 0) > (isIOS ? 100 : 120)
                ? 'text-red-600 font-medium'
                : 'text-gray-900'
            }
          >
            {body?.length || 0}/{isIOS ? 100 : 120}
          </span>
        </div>
      </div>

      {/* Unsupported Features Warning */}
      {isIOS && image && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.585 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.585-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>iOS Safari does not support notification images</span>
        </div>
      )}

      {isIOS && actions && actions.length > 1 && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.585 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.585-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>iOS Safari supports only 1 action button</span>
        </div>
      )}
    </div>
  );
}
