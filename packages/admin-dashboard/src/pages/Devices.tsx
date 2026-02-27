import {
  faAndroid as faAndroidBrand,
  faApple as faAppleBrand,
  faChrome as faChromeBrand,
  faEdge as faEdgeBrand,
  faFirefox as faFirefoxBrand,
  faSafari as faSafariBrand,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCheck,
  faDesktop,
  faEye,
  faGlobe,
  faMobileScreen,
  faRefresh,
  faSearch,
  faTabletScreenButton,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { api, Device } from '../lib/api';

export function Devices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [browserFilter, setBrowserFilter] = useState<string>('all');

  const {
    data: devicesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.getDevices(),
  });

  const { data: deviceStats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: () => api.getDeviceStats(),
  });

  const devices = devicesData?.devices || [];
  const stats = deviceStats?.stats;

  // Filter devices
  const filteredDevices = devices.filter((device: Device) => {
    const matchesSearch =
      !searchTerm ||
      device.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.browserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.osName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlatform = platformFilter === 'all' || device.platform === platformFilter;

    const matchesBrowser = browserFilter === 'all' || device.browserName === browserFilter;

    return matchesSearch && matchesPlatform && matchesBrowser;
  });

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('ios') || p === 'apple')
      return { icon: faAppleBrand, color: 'text-neutral-700', label: 'iOS' };
    if (p.includes('android'))
      return { icon: faAndroidBrand, color: 'text-success-600', label: 'Android' };
    if (p.includes('desktop'))
      return { icon: faDesktop, color: 'text-primary-600', label: 'Desktop' };
    if (p.includes('tablet'))
      return { icon: faTabletScreenButton, color: 'text-accent-600', label: 'Tablet' };
    return { icon: faMobileScreen, color: 'text-neutral-600', label: platform };
  };

  // Get browser icon
  const getBrowserIcon = (browser?: string) => {
    if (!browser) return null;
    const b = browser.toLowerCase();
    if (b.includes('chrome'))
      return { icon: faChromeBrand, color: 'text-primary-500', label: browser };
    if (b.includes('firefox'))
      return { icon: faFirefoxBrand, color: 'text-orange-500', label: browser };
    if (b.includes('safari'))
      return { icon: faSafariBrand, color: 'text-primary-400', label: browser };
    if (b.includes('edge')) return { icon: faEdgeBrand, color: 'text-primary-600', label: browser };
    return { icon: faGlobe, color: 'text-neutral-400', label: browser };
  };

  // Get device type icon
  const getDeviceTypeIcon = (type?: string) => {
    switch (type) {
      case 'mobile':
        return { icon: faMobileScreen, color: 'text-indigo-600', label: 'Mobile' };
      case 'desktop':
        return { icon: faDesktop, color: 'text-primary-600', label: 'Desktop' };
      case 'tablet':
        return { icon: faTabletScreenButton, color: 'text-accent-600', label: 'Tablet' };
      default:
        return { icon: faMobileScreen, color: 'text-neutral-400', label: type || 'Unknown' };
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('all');
    setBrowserFilter('all');
  };

  const hasFilters = searchTerm || platformFilter !== 'all' || browserFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Devices</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage and monitor subscriber devices</p>
        </div>
        <Button variant="secondary" size="sm" icon={faRefresh} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide mb-2">
                <FontAwesomeIcon icon={faMobileScreen} className="text-indigo-500" />
                Total Devices
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {formatNumber(stats.total || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Platform Breakdown */}
          {stats.byPlatform?.slice(0, 3).map((platformStat) => {
            const platformInfo = getPlatformIcon(platformStat.platform);
            return (
              <Card key={platformStat.platform}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide">
                      <FontAwesomeIcon icon={platformInfo.icon} className={platformInfo.color} />
                      {platformInfo.label}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {formatNumber(platformStat.count)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Platforms</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
            </select>

            {/* Browser Filter */}
            <select
              value={browserFilter}
              onChange={(e) => setBrowserFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Browsers</option>
              <option value="Chrome">Chrome</option>
              <option value="Firefox">Firefox</option>
              <option value="Safari">Safari</option>
              <option value="Edge">Edge</option>
            </select>

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" size="sm" icon={faXmark} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-neutral-500">Loading devices...</div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <FontAwesomeIcon icon={faMobileScreen} className="text-4xl mb-3" />
              <p>No devices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Browser
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Capabilities
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredDevices.map((device: Device) => {
                    const platformInfo = getPlatformIcon(device.platform);
                    const deviceTypeInfo = getDeviceTypeIcon(device.deviceType);
                    const browserInfo = getBrowserIcon(device.browserName);

                    return (
                      <tr key={device.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg bg-neutral-100 ${deviceTypeInfo.color}`}
                            >
                              <FontAwesomeIcon icon={deviceTypeInfo.icon} />
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">
                                {deviceTypeInfo.label}
                              </div>
                              {device.deviceModel && (
                                <div className="text-xs text-neutral-500">{device.deviceModel}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={platformInfo.icon}
                              className={platformInfo.color}
                            />
                            <span className="text-sm text-neutral-700">{platformInfo.label}</span>
                          </div>
                          {device.osVersion && (
                            <div className="text-xs text-neutral-500">{device.osVersion}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {browserInfo ? (
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon
                                icon={browserInfo.icon}
                                className={browserInfo.color}
                              />
                              <span className="text-sm text-neutral-700">{browserInfo.label}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">-</span>
                          )}
                          {device.browserVersion && (
                            <div className="text-xs text-neutral-500">v{device.browserVersion}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {device.supportsActions && (
                              <Badge variant="success" size="sm" icon={faCheck}>
                                Actions
                              </Badge>
                            )}
                            {device.supportsImages && (
                              <Badge variant="primary" size="sm" icon={faEye}>
                                Images
                              </Badge>
                            )}
                            {device.supportsVibrate && (
                              <Badge variant="default" size="sm">
                                Vibrate
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="View details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
