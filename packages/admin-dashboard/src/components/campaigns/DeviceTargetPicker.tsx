import {
  faAndroid,
  faApple,
  faChrome,
  faEdge,
  faFirefox,
  faSafari,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCheck,
  faDesktop,
  faMobileScreen,
  faTabletScreenButton,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface DeviceTargetPickerProps {
  platforms?: string[];
  browsers?: string[];
  deviceTypes?: string[];
  onChange: (targets: {
    platforms?: string[];
    browsers?: string[];
    deviceTypes?: string[];
  }) => void;
}

const PLATFORM_OPTIONS = [
  { value: 'ios', label: 'iOS', icon: faApple, color: 'text-gray-800' },
  { value: 'android', label: 'Android', icon: faAndroid, color: 'text-green-600' },
  { value: 'desktop', label: 'Desktop', icon: faDesktop, color: 'text-blue-600' },
  { value: 'tablet', label: 'Tablet', icon: faTabletScreenButton, color: 'text-purple-600' },
];

const BROWSER_OPTIONS = [
  { value: 'Chrome', label: 'Chrome', icon: faChrome, color: 'text-blue-500' },
  { value: 'Firefox', label: 'Firefox', icon: faFirefox, color: 'text-orange-500' },
  { value: 'Safari', label: 'Safari', icon: faSafari, color: 'text-blue-400' },
  { value: 'Edge', label: 'Edge', icon: faEdge, color: 'text-blue-600' },
];

const DEVICE_TYPE_OPTIONS = [
  { value: 'mobile', label: 'Mobile', icon: faMobileScreen, color: 'text-indigo-600' },
  { value: 'desktop', label: 'Desktop', icon: faDesktop, color: 'text-blue-600' },
  { value: 'tablet', label: 'Tablet', icon: faTabletScreenButton, color: 'text-purple-600' },
];

export function DeviceTargetPicker({
  platforms = [],
  browsers = [],
  deviceTypes = [],
  onChange,
}: DeviceTargetPickerProps) {
  const togglePlatform = (value: string) => {
    const newPlatforms = platforms.includes(value)
      ? platforms.filter((p) => p !== value)
      : [...platforms, value];
    onChange({ platforms: newPlatforms, browsers, deviceTypes });
  };

  const toggleBrowser = (value: string) => {
    const newBrowsers = browsers.includes(value)
      ? browsers.filter((b) => b !== value)
      : [...browsers, value];
    onChange({ platforms, browsers: newBrowsers, deviceTypes });
  };

  const toggleDeviceType = (value: string) => {
    const newDeviceTypes = deviceTypes.includes(value)
      ? deviceTypes.filter((d) => d !== value)
      : [...deviceTypes, value];
    onChange({ platforms, browsers, deviceTypes: newDeviceTypes });
  };

  const clearAll = () => {
    onChange({ platforms: [], browsers: [], deviceTypes: [] });
  };

  const hasSelection = platforms.length > 0 || browsers.length > 0 || deviceTypes.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Target Devices</h3>
        {hasSelection && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Platforms */}
      <div>
        <span id="platform-label" className="text-xs font-medium text-gray-700 mb-2 block">
          Platform
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: Using div for layout flexibility */}
        <div id="platform-select" className="flex flex-wrap gap-2" role="group" aria-labelledby="platform-label">
          {PLATFORM_OPTIONS.map((option) => {
            const isSelected = platforms.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => togglePlatform(option.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-200 border-2
                  ${
                    isSelected
                      ? `${option.color} bg-opacity-10 border-current`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <FontAwesomeIcon
                  icon={option.icon}
                  className={isSelected ? option.color : 'text-gray-400'}
                />
                <span>{option.label}</span>
                {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-1 text-xs" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Device Types */}
      <div>
        <span
          id="device-type-label"
          className="text-xs font-medium text-gray-700 mb-2 block"
        >
          Device Type
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: Using div for layout flexibility */}
        <div id="device-type-select" className="flex flex-wrap gap-2" role="group" aria-labelledby="device-type-label">
          {DEVICE_TYPE_OPTIONS.map((option) => {
            const isSelected = deviceTypes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleDeviceType(option.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-200 border-2
                  ${
                    isSelected
                      ? `${option.color} bg-opacity-10 border-current`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <FontAwesomeIcon
                  icon={option.icon}
                  className={isSelected ? option.color : 'text-gray-400'}
                />
                <span>{option.label}</span>
                {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-1 text-xs" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Browsers */}
      <div>
        <span id="browser-label" className="text-xs font-medium text-gray-700 mb-2 block">
          Browser
        </span>
        {/* biome-ignore lint/a11y/useSemanticElements: Using div for layout flexibility */}
        <div id="browser-select" className="flex flex-wrap gap-2" role="group" aria-labelledby="browser-label">
          {BROWSER_OPTIONS.map((option) => {
            const isSelected = browsers.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleBrowser(option.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-200 border-2
                  ${
                    isSelected
                      ? `${option.color} bg-opacity-10 border-current`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <FontAwesomeIcon
                  icon={option.icon}
                  className={isSelected ? option.color : 'text-gray-400'}
                />
                <span>{option.label}</span>
                {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-1 text-xs" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {hasSelection && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 text-xs">
            {platforms.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                <FontAwesomeIcon icon={faDesktop} className="text-gray-500" />
                {platforms.length} platform{platforms.length !== 1 ? 's' : ''}
              </span>
            )}
            {browsers.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                <FontAwesomeIcon icon={faChrome} className="text-gray-500" />
                {browsers.length} browser{browsers.length !== 1 ? 's' : ''}
              </span>
            )}
            {deviceTypes.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                <FontAwesomeIcon icon={faMobileScreen} className="text-gray-500" />
                {deviceTypes.length} type{deviceTypes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
