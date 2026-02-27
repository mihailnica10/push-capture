import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Analytics } from './pages/Analytics';
import { DevicesAnalytics } from './pages/analytics/Devices';
import { ErrorsAnalytics } from './pages/analytics/Errors';
import { GeographyAnalytics } from './pages/analytics/Geography';
import { PerformanceAnalytics } from './pages/analytics/Performance';
import { RealtimeAnalytics } from './pages/analytics/Realtime';
import { Campaigns } from './pages/Campaigns';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { PushNotifications } from './pages/PushNotifications';
import { Settings } from './pages/Settings';
import { Subscriptions } from './pages/Subscriptions';
import { Traffic } from './pages/Traffic';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/push" element={<PushNotifications />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/analytics/geography" element={<GeographyAnalytics />} />
        <Route path="/analytics/performance" element={<PerformanceAnalytics />} />
        <Route path="/analytics/devices" element={<DevicesAnalytics />} />
        <Route path="/analytics/errors" element={<ErrorsAnalytics />} />
        <Route path="/analytics/realtime" element={<RealtimeAnalytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
