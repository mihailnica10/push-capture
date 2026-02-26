import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, Send, Bell } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/subscriptions', label: 'Subscriptions', icon: Users },
  { path: '/traffic', label: 'Traffic', icon: Activity },
  { path: '/push', label: 'Push Notifications', icon: Send },
];

export function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Push Capture</h1>
          <p className="text-gray-400 text-sm">Admin Dashboard</p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}
