import { Bell, BellOff, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePushSubscription } from './hooks/usePushSubscription';
import {
  generateDeviceFingerprint,
  getDeviceCapabilities,
  initTracking,
  sendAnalytics,
  setupAutoTracking,
  trackPageView,
} from './utils/analytics';

function App() {
  const {
    isSupported,
    isSubscribed,
    isPermissionDenied,
    isLoading,
    subscribe,
    unsubscribe,
    error,
    refreshStatus,
  } = usePushSubscription();
  const [notificationTest, setNotificationTest] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Initialize comprehensive analytics
    const initializeAnalytics = async () => {
      await initTracking();
      await trackPageView();
      setupAutoTracking();

      // Send device capabilities
      const capabilities = getDeviceCapabilities();
      const fingerprint = generateDeviceFingerprint();

      // Send device info to backend
      fetch('/api/analytics/device-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          capabilities,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    };

    initializeAnalytics();
  }, []);

  useEffect(() => {
    // Handle incoming push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('push', (event: Event) => {
          const pushEvent = event as any;
          const data = pushEvent.data?.json();
          if (data) {
            setNotificationTest(`Received: ${data.title}`);
            setTimeout(() => setNotificationTest(null), 5000);

            // Track notification received
            sendAnalytics();
          }
        });
      });
    }

    // Refresh subscription status periodically
    const interval = setInterval(() => {
      refreshStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Track subscription state changes
  useEffect(() => {
    if (!isLoading) {
      if (isSubscribed) {
        fetch('/api/analytics/subscription-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: 'subscribed',
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
    }
  }, [isSubscribed, isLoading]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const success = await subscribe();
    setIsSubscribing(false);
    if (success) {
      setNotificationTest('Successfully subscribed!');
      setTimeout(() => setNotificationTest(null), 3000);
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubscribing(true);
    const success = await unsubscribe();
    setIsSubscribing(false);
    if (success) {
      setNotificationTest('Successfully unsubscribed');
      setTimeout(() => setNotificationTest(null), 3000);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">Setting up notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              isSubscribed ? 'bg-green-100' : 'bg-gray-100'
            }`}
          >
            {isSubscribed ? (
              <Bell className="text-green-600" size={32} />
            ) : (
              <BellOff className="text-gray-400" size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-gray-600 mt-2">
            {isSubscribed
              ? "You're subscribed to receive notifications"
              : 'Subscribe to receive push notifications'}
          </p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3">
            <XCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {notificationTest && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{notificationTest}</span>
          </div>
        )}

        {!isSupported && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
            Push notifications are not supported in your browser.
          </div>
        )}

        {/* Action button */}
        {isSupported && !isPermissionDenied && (
          <button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isSubscribing}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
              isSubscribed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            } ${isSubscribing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubscribing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
              </>
            ) : isSubscribed ? (
              'Unsubscribe'
            ) : (
              'Subscribe to Notifications'
            )}
          </button>
        )}

        {/* Permission denied message */}
        {isPermissionDenied && (
          <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg">
            <p className="font-medium">Notifications blocked</p>
            <p className="text-sm mt-1">
              Please enable notifications in your browser settings and refresh.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">What you'll receive:</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Real-time traffic alerts
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              System notifications
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Important updates
            </li>
          </ul>
        </div>

        {/* Subscription status indicator */}
        {isSubscribed && (
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            <span>Active subscription detected</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
