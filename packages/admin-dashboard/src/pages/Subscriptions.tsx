import {
  faAndroid as faAndroidBrand,
  faApple as faAppleBrand,
  faChrome as faChromeBrand,
  faEdge as faEdgeBrand,
  faFirefox as faFirefoxBrand,
  faSafari as faSafariBrand,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCalendar,
  faCheck,
  faClock,
  faCopy,
  faDesktop,
  faEye,
  faEyeSlash,
  faGlobe,
  faMobileScreen,
  faServer,
  faTabletScreenButton,
  faTrashCan,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { api, Subscription } from '../lib/api';

export function Subscriptions() {
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowDeleteModal(false);
      setSelectedSubscription(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateSubscriptionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const handleDelete = () => {
    if (selectedSubscription) {
      deleteMutation.mutate(selectedSubscription.id);
    }
  };

  const toggleStatus = (subscription: Subscription) => {
    const newStatus = subscription.status === 'active' ? 'inactive' : 'active';
    statusMutation.mutate({ id: subscription.id, status: newStatus });
  };

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent)
      return { browser: null, os: null, device: 'Unknown', deviceType: 'Unknown', icon: faDesktop };

    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = null;
    if (ua.includes('chrome') && !ua.includes('edg'))
      browser = { icon: faChromeBrand, name: 'Chrome', color: 'text-blue-500' };
    else if (ua.includes('firefox'))
      browser = { icon: faFirefoxBrand, name: 'Firefox', color: 'text-orange-500' };
    else if (ua.includes('safari') && !ua.includes('chrome'))
      browser = { icon: faSafariBrand, name: 'Safari', color: 'text-blue-400' };
    else if (ua.includes('edg'))
      browser = { icon: faEdgeBrand, name: 'Edge', color: 'text-blue-600' };

    // Detect OS
    let os = null;
    if (ua.includes('android'))
      os = { icon: faAndroidBrand, name: 'Android', color: 'text-green-600' };
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios'))
      os = { icon: faAppleBrand, name: 'iOS', color: 'text-gray-700' };
    else if (ua.includes('windows'))
      os = { icon: faDesktop, name: 'Windows', color: 'text-blue-600' };
    else if (ua.includes('mac')) os = { icon: faAppleBrand, name: 'macOS', color: 'text-gray-700' };
    else if (ua.includes('linux')) os = { icon: faServer, name: 'Linux', color: 'text-yellow-600' };

    // Detect device type
    let device = faDesktop;
    let deviceType = 'Desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = faMobileScreen;
      deviceType = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = faTabletScreenButton;
      deviceType = 'Tablet';
    }

    return { browser, os, device, deviceType, icon: device };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const activeSubs = subscriptions?.subscriptions.filter((s) => s.status === 'active').length || 0;
  const totalSubs = subscriptions?.subscriptions.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Subscriptions</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage push notification subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success">{activeSubs} active</Badge>
          <Badge variant="default">{totalSubs} total</Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-50">
                <FontAwesomeIcon icon={faCheck} className="text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{activeSubs}</p>
                <p className="text-sm text-neutral-500">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neutral-100">
                <FontAwesomeIcon icon={faXmark} className="text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{totalSubs - activeSubs}</p>
                <p className="text-sm text-neutral-500">Inactive Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-50">
                <FontAwesomeIcon icon={faGlobe} className="text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{totalSubs}</p>
                <p className="text-sm text-neutral-500">Total Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>View and manage all push notification subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-neutral-500">
              <FontAwesomeIcon icon={faClock} className="text-2xl mb-2 animate-spin" />
              <p>Loading subscriptions...</p>
            </div>
          ) : subscriptions?.subscriptions && subscriptions.subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Subscription ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Device & Browser
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.subscriptions.map((sub) => {
                    const ua = parseUserAgent(sub.userAgent);
                    return (
                      <tr
                        key={sub.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono max-w-[120px] truncate block">
                              {sub.id.slice(0, 8)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(sub.id)}
                              className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                              title="Copy ID"
                            >
                              <FontAwesomeIcon icon={faCopy} className="text-xs" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Device Icon */}
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={ua.icon} className="text-neutral-600" />
                              <span className="text-xs text-neutral-500">{ua.deviceType}</span>
                            </div>
                            {/* Browser Icon */}
                            {ua.browser && (
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon={ua.browser.icon}
                                  className={ua.browser.color}
                                />
                                <span className="text-xs text-neutral-500">{ua.browser.name}</span>
                              </div>
                            )}
                            {/* OS Icon */}
                            {ua.os && (
                              <div className="flex items-center gap-1">
                                <FontAwesomeIcon icon={ua.os.icon} className={ua.os.color} />
                                <span className="text-xs text-neutral-500">{ua.os.name}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <FontAwesomeIcon icon={faCalendar} />
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleStatus(sub)}
                              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title={sub.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              <FontAwesomeIcon
                                icon={sub.status === 'active' ? faEyeSlash : faEye}
                                className="text-sm"
                              />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                              title="Delete subscription"
                            >
                              <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-500">
              <FontAwesomeIcon icon={faMobileScreen} className="text-4xl mb-3 text-neutral-300" />
              <p className="font-medium text-neutral-900">No subscriptions yet</p>
              <p className="text-sm">
                Subscriptions will appear here when users subscribe to push notifications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSubscription(null);
        }}
        title="Delete Subscription"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to delete this subscription? This action cannot be undone.
          </p>
          {selectedSubscription && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Subscription ID</p>
              <code className="text-sm font-mono text-neutral-900">
                {selectedSubscription.id.slice(0, 16)}...
              </code>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedSubscription(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
