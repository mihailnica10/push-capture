import {
  faBars,
  faBell,
  faBullhorn,
  faChartLine,
  faChevronDown,
  faChevronRight,
  faClock,
  faDesktop,
  faGauge,
  faGaugeHigh,
  faGear,
  faGlobe,
  faMobileScreen,
  faMoon,
  faNetworkWired,
  faPaperPlane,
  faSun,
  faTriangleExclamation,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

interface NavItem {
  path: string;
  label: string;
  icon: IconProp;
  badge?: number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: faGaugeHigh },
  { path: '/subscriptions', label: 'Subscriptions', icon: faUsers },
  { path: '/devices', label: 'Devices', icon: faMobileScreen },
  { path: '/traffic', label: 'Traffic', icon: faNetworkWired },
  { path: '/push', label: 'Send Push', icon: faPaperPlane },
  { path: '/campaigns', label: 'Campaigns', icon: faBullhorn },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: faChartLine,
    children: [
      { path: '/analytics', label: 'Overview', icon: faChartLine },
      { path: '/analytics/geography', label: 'Geography', icon: faGlobe },
      { path: '/analytics/performance', label: 'Performance', icon: faGauge },
      { path: '/analytics/devices', label: 'Devices', icon: faDesktop },
      { path: '/analytics/errors', label: 'Errors', icon: faTriangleExclamation },
      { path: '/analytics/realtime', label: 'Realtime', icon: faClock },
    ],
  },
  { path: '/settings', label: 'Settings', icon: faGear },
];

export function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['/analytics']));

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSection = (path: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(
        (child) =>
          location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
      );
    }
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gradient-to-b from-neutral-900 to-neutral-800 text-white
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBell} className="text-white text-sm" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">Push Capture</h1>
              </div>
              <p className="text-neutral-400 text-xs">Admin Dashboard</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faBars} />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white"
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.has(item.path);

            return (
              <div key={item.path}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(item.path);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className={`${sidebarCollapsed ? 'text-lg' : 'text-base'} ${isActive ? 'text-white' : ''}`}
                  />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {hasChildren && (
                        <FontAwesomeIcon
                          icon={isExpanded ? faChevronDown : faChevronRight}
                          className="text-xs transition-transform"
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {hasChildren && !sidebarCollapsed && isExpanded && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {item.children?.map((child) => {
                      const isChildActive =
                        location.pathname === child.path ||
                        location.pathname.startsWith(`${child.path}/`);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                            ${
                              isChildActive
                                ? 'bg-white/10 text-white'
                                : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          <FontAwesomeIcon icon={child.icon} className="text-xs" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-neutral-900/50 backdrop-blur">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-3 w-full px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button type="button" className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg relative">
              <FontAwesomeIcon icon={faBell} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children || <Outlet />}</div>
      </main>
    </div>
  );
}
