import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  Gavel, 
  History, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={20} />, label: 'Groups', path: '/groups' },
    { icon: <LineChart size={20} />, label: 'Optimization Center', path: '/optimize' },
    { icon: <Gavel size={20} />, label: 'Disputes', path: '/disputes' },
    { icon: <History size={20} />, label: 'Activity', path: '/activity' },
  ];

  const secondaryItems = [
    { icon: <HelpCircle size={20} />, label: 'Help', path: '/help' },
    { icon: <LogOut size={20} />, label: 'Logout', path: '/login' },
  ];

  return (
    <aside style={{
      width: '200px',
      height: '100vh',
      backgroundColor: 'var(--color-surface-container-low)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>The Modern Caravan</h1>
        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
          Premium Expense Logic
        </p>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
              <NavLink 
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                  backgroundColor: isActive ? 'var(--color-surface-container-high)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease'
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '2rem', opacity: 0.6 }}>
        <ul style={{ listStyle: 'none' }}>
          {secondaryItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
              <NavLink 
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  textDecoration: 'none',
                  color: 'var(--color-on-surface-variant)',
                  fontWeight: '500'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
