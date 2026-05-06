import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GroupDetail from './pages/GroupDetail';
import OptimizationCenter from './pages/OptimizationCenter';
import ActivityLog from './pages/ActivityLog';
import Disputes from './pages/Disputes';

/** Redirects unauthenticated users to /login */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-on-primary)', fontSize: '1.25rem' }}>S</div>
          <p style={{ color: 'var(--color-on-surface-variant)', fontWeight: '500' }}>Loading SkillSplit…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/** Redirects authenticated users away from auth pages */
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id" element={<ProtectedRoute><Layout><GroupDetail /></Layout></ProtectedRoute>} />
      <Route path="/optimize" element={<ProtectedRoute><Layout><OptimizationCenter /></Layout></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><Layout><Disputes /></Layout></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><Layout><ActivityLog /></Layout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Layout><div style={{ padding: '2rem' }}><h2 className="text-headline-lg">Help Center</h2><p className="text-body-lg" style={{ marginTop: '0.5rem' }}>Coming Soon. Reach out to your group admin for assistance.</p></div></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
