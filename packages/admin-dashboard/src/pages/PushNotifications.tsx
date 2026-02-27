import {
  faBroadcastTower,
  faCircleCheck,
  faCopy,
  faHeading,
  faLink,
  faPaperPlane,
  faTriangleExclamation,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
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
      mode === 'single' ? api.sendPush(subscriptionId, data) : api.broadcastPush(data),
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Push Notifications</h1>
        <p className="text-sm text-neutral-500 mt-1">Send notifications to subscribers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compose Notification</CardTitle>
            <CardDescription>Create and send push notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg mb-6 w-fit">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'single'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Send to One
              </button>
              <button
                type="button"
                onClick={() => setMode('broadcast')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'broadcast'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FontAwesomeIcon icon={faBroadcastTower} />
                Broadcast
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'single' && (
                <Input
                  label="Subscription ID"
                  icon={faUser}
                  value={subscriptionId}
                  onChange={(e) => setSubscriptionId(e.target.value)}
                  required
                  placeholder="e.g., 44bcbacd-d132-4086-a17d-cdc4cb3245dd"
                  helperText="The unique ID of the subscriber (find it in Subscriptions page)"
                />
              )}

              <Input
                label="Title"
                icon={faHeading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Notification title"
              />

              <Textarea
                label="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Notification body message"
                helperText="Keep it concise and engaging"
              />

              <Input
                label="URL (optional)"
                icon={faLink}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                helperText="URL to open when notification is clicked"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                icon={faPaperPlane}
                loading={sendMutation.isPending}
              >
                {sendMutation.isPending
                  ? 'Sending...'
                  : mode === 'single'
                    ? 'Send Notification'
                    : 'Broadcast to All'}
              </Button>

              {sendMutation.isSuccess && (
                <div className="flex items-center gap-2 p-3 bg-success-50 text-success-700 rounded-lg">
                  <FontAwesomeIcon icon={faCircleCheck} />
                  Notification sent successfully!
                </div>
              )}

              {sendMutation.isError && (
                <div className="flex items-center gap-2 p-3 bg-error-50 text-error-700 rounded-lg">
                  <FontAwesomeIcon icon={faTriangleExclamation} />
                  Failed to send notification
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-success-500 mt-0.5" />
                  <span>Keep titles under 30 characters for best display</span>
                </li>
                <li className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-success-500 mt-0.5" />
                  <span>Body text should be concise and action-oriented</span>
                </li>
                <li className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-success-500 mt-0.5" />
                  <span>Include a URL to drive users to specific content</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Find Subscription ID */}
          <Card>
            <CardHeader>
              <CardTitle>Find Subscription ID</CardTitle>
              <CardDescription>Copy IDs from the subscriptions page</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/subscriptions"
                className="flex items-center gap-2 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors text-sm text-neutral-700"
              >
                <FontAwesomeIcon icon={faUser} className="text-neutral-500" />
                <span>Go to Subscriptions</span>
                <FontAwesomeIcon icon={faCopy} className="ml-auto text-neutral-400" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
