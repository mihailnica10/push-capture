import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { usePushSubscription } from './hooks/usePushSubscription';

function App() {
  const { isSupported, isSubscribed, isPermissionDenied, subscribe, unsubscribe, error } = usePushSubscription();
  const [notificationTest, setNotificationTest] = useState<string | null>(null);

  useEffect(() => {
    // Handle incoming push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('push', (event) => {
          const data = event.data?.json();
          if (data) {
            setNotificationTest(`Received: ${data.title}`);
            setTimeout(() => setNotificationTest(null), 5000);
          }
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setNotificationTest('Successfully subscribed!');
      setTimeout(() => setNotificationTest(null), 3000);
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      setNotificationTest('Successfully unsubscribed');
      setTimeout(() => setNotificationTest(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSubscribed ? 'bg-green-100' : 'bg-gray-100'
          }`}>
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
            disabled={!isSubscribed && !subscribe}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isSubscribed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe to Notifications'}
          </button>
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
      </div>
    </div>
  );
}

export default App;
