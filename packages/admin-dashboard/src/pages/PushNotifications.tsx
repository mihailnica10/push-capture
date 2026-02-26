import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Radio } from 'lucide-react';
import { api } from '../lib/api';

export function PushNotifications() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'single' | 'broadcast'>('single');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');

  const sendMutation = useMutation({
    mutationFn: (data: { title: string; body: string; url?: string }) =>
      mode === 'single'
        ? api.sendPush(subscriptionId, data)
        : api.broadcastPush(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setTitle('');
      setBody('');
      setUrl('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate({ title, body, url: url || undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-600 mt-1">Send notifications to subscribers</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Send size={18} />
            Send to One
          </button>
          <button
            onClick={() => setMode('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'broadcast'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Radio size={18} />
            Broadcast
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {mode === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription ID
              </label>
              <input
                type="text"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subscription ID"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notification body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {sendMutation.isPending ? 'Sending...' : mode === 'single' ? 'Send Notification' : 'Broadcast'}
          </button>

          {sendMutation.isSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg">
              Notification sent successfully!
            </div>
          )}

          {sendMutation.isError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg">
              Failed to send notification
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
