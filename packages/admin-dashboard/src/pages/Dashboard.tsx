import {
  faArrowTrendUp,
  faGaugeHigh,
  faPaperPlane,
  faTriangleExclamation,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { api } from '../lib/api';

export function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['traffic-stats'],
    queryFn: () => api.getTrafficStats(),
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
  });

  const activeSubs = subscriptions?.subscriptions.filter((s) => s.status === 'active').length || 0;

  const totalEvents = stats?.stats.total || 0;
  const topUrls = stats?.stats.topUrls || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Overview of your push notification platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Traffic Events"
          value={totalEvents.toLocaleString()}
          icon={faGaugeHigh}
          color="blue"
          trend={topUrls.length > 0 ? '+12%' : undefined}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs.toLocaleString()}
          icon={faUsers}
          color="green"
        />
        <StatCard title="Notifications Sent" value="0" icon={faPaperPlane} color="purple" />
        <StatCard title="Failed Deliveries" value="0" icon={faTriangleExclamation} color="red" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top URLs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top URLs</CardTitle>
            <CardDescription>Most captured HTTP endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            {topUrls.length > 0 ? (
              <div className="space-y-3">
                {topUrls.slice(0, 5).map((item, index) => (
                  <div
                    key={`url-${index}-${item.url.slice(0, 20)}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-medium text-neutral-400 w-5">{index + 1}</span>
                      <span
                        className="text-sm text-neutral-700 truncate font-mono"
                        title={item.url}
                      >
                        {item.url}
                      </span>
                    </div>
                    <Badge variant="info">{item.count} hits</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-500 text-sm">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-2xl mb-2 text-neutral-300" />
                <p>No traffic data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <QuickAction
                icon={faPaperPlane}
                label="Send Push"
                description="Send a single notification"
                href="/push"
              />
              <QuickAction
                icon={faUsers}
                label="View Subscriptions"
                description="Manage all subscribers"
                href="/subscriptions"
              />
              <QuickAction
                icon={faGaugeHigh}
                label="View Traffic"
                description="See HTTP captures"
                href="/traffic"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: IconProp;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
  trend?: string;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colors = {
    blue: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
    green: { bg: 'bg-success-50', text: 'text-success-600', border: 'border-success-200' },
    purple: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' },
    red: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
    orange: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' },
  };

  const colorSet = colors[color];

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-2">{value}</p>
            {trend && (
              <span className="text-xs text-success-600 font-medium mt-1 inline-flex items-center gap-1">
                <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
                {trend}
              </span>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorSet.bg} ${colorSet.border} border`}>
            <FontAwesomeIcon icon={icon} className={`${colorSet.text} text-lg`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  icon: IconProp;
  label: string;
  description: string;
  href: string;
}

function QuickAction({ icon, label, description, href }: QuickActionProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
    >
      <div className="p-2 rounded-lg bg-neutral-100 group-hover:bg-primary-50 transition-colors">
        <FontAwesomeIcon icon={icon} className="text-neutral-600 group-hover:text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="text-xs text-neutral-500 truncate">{description}</p>
      </div>
    </a>
  );
}
