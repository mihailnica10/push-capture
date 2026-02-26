import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Subscriptions } from './pages/Subscriptions';
import { Traffic } from './pages/Traffic';
import { PushNotifications } from './pages/PushNotifications';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/push" element={<PushNotifications />} />
      </Routes>
    </Layout>
  );
}

export default App;
