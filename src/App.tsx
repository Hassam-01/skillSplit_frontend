import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GroupDetail from './pages/GroupDetail';
import OptimizationCenter from './pages/OptimizationCenter';
import ActivityLog from './pages/ActivityLog';
import Disputes from './pages/Disputes';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/optimize" element={<OptimizationCenter />} />
        <Route path="/disputes" element={<Disputes />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/help" element={<div className="text-headline-lg">Help Center (Coming Soon)</div>} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
