import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '../lib/api';

export function Subscriptions() {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-1">Manage push notification subscriptions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : subscriptions?.subscriptions.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Endpoint</th>
                <th className="text-left p-4 font-semibold text-gray-700">User Agent</th>
                <th className="text-left p-4 font-semibold text-gray-700">Created</th>
                <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="p-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded truncate max-w-xs block">
                      {sub.endpoint}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {sub.userAgent || 'Unknown'}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(sub.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No subscriptions yet</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    failed: 'bg-red-100 text-red-700',
  };

  const style = styles[status as keyof typeof styles] || styles.inactive;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
