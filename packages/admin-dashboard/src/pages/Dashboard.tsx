import { useQuery } from '@tanstack/react-query';
import { Activity, Users, Send, AlertCircle } from 'lucide-react';
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

  const activeSubs = subscriptions?.subscriptions.filter(s => s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your push notification platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Traffic Events"
          value={stats?.stats.total || 0}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Notifications Sent"
          value="0"
          icon={Send}
          color="purple"
        />
        <StatCard
          title="Failed Deliveries"
          value="0"
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Top URLs</h2>
        {stats?.stats.topUrls.length ? (
          <div className="space-y-3">
            {stats.stats.topUrls.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-gray-700 truncate max-w-lg" title={item.url}>{item.url}</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {item.count} hits
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No traffic data yet</p>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${colors[color]} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}
