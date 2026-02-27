import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function Traffic() {
  const { data: traffic, isLoading } = useQuery({
    queryKey: ['traffic'],
    queryFn: () => api.getTraffic(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Traffic Events</h1>
        <p className="text-gray-600 mt-1">Captured HTTP traffic data</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : traffic?.traffic.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Method</th>
                <th className="text-left p-4 font-semibold text-gray-700">URL</th>
                <th className="text-left p-4 font-semibold text-gray-700">Source</th>
                <th className="text-left p-4 font-semibold text-gray-700">Time</th>
              </tr>
            </thead>
            <tbody>
              {traffic.traffic.map((event) => (
                <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <MethodBadge method={event.method} />
                  </td>
                  <td className="p-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{event.url}</code>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{event.source}</td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No traffic events yet</div>
        )}
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
    PATCH: 'bg-purple-100 text-purple-700',
  };

  const style = styles[method] || 'bg-gray-100 text-gray-700';

  return <span className={`px-2 py-1 rounded text-xs font-bold ${style}`}>{method}</span>;
}
