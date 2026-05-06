import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LineChart, Gavel, History, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import ConfirmModal from './ConfirmModal';
import { Sun, Moon } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={20} />, label: 'Groups', path: '/groups' },
    { icon: <LineChart size={20} />, label: 'Optimization Center', path: '/optimize' },
    { icon: <Gavel size={20} />, label: 'Disputes', path: '/disputes' },
    { icon: <History size={20} />, label: 'Activity', path: '/activity' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
        />
      )}

      <aside
        style={{
          width: '240px',
          height: '100vh',
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderRight: '1px solid var(--color-outline-variant)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: isOpen ? '10px 0 30px rgba(0,0,0,0.15)' : 'none',
          overflowY: 'auto',
        }}
        className="sidebar-component"
      >
        {/* Logo + close button */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>SkillSplit</h1>
            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>Premium Expense Logic</p>
          </div>
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg-hide" style={{ background: 'none', border: 'none', color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* User profile */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-primary)', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: '600', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-on-surface)' }}>{profile?.display_name ?? 'User'}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none' }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: '0.25rem' }}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
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
                    fontSize: '0.9rem',
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom actions — theme toggle + logout */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Theme toggle — desktop only (mobile header has one) */}
          <button
            id="sidebar-theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-on-surface-variant)',
              fontWeight: '500',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
            }}
          >
            {isDark
              ? <Sun size={20} color="var(--color-on-tertiary-container)" />
              : <Moon size={20} />
            }
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout */}
          <button
            aria-label="Sidebar Logout"
            onClick={() => setIsLogoutConfirmOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-error)',
              fontWeight: '600',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              opacity: 0.85,
              fontSize: '0.9rem',
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to sign out of your account?"
        confirmText="Logout"
        type="danger"
      />
    </>
  );
};

export default Sidebar;
