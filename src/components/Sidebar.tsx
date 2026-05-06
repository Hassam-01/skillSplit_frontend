import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LineChart, Gavel, History, HelpCircle, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const Sidebar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [user]);

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
    <aside style={{ width: '200px', height: '100vh', backgroundColor: 'var(--color-surface-container-low)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.125rem', color: 'var(--color-primary)' }}>SkillSplit</h1>
        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>Premium Expense Logic</p>
      </div>

      {/* User profile */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: '600', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name ?? 'User'}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
          </div>
        </div>
      )}

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
              <NavLink to={item.path} end={item.path === '/'} style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', backgroundColor: isActive ? 'var(--color-surface-container-high)' : 'transparent', fontWeight: isActive ? '600' : '500', transition: 'all 0.2s ease' })}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '1.5rem' }}>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <NavLink to="/help" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--color-on-surface-variant)', fontWeight: '500', opacity: 0.7 }}>
              <HelpCircle size={20} />
              <span>Help</span>
            </NavLink>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <NavLink to="/activity" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--color-on-surface-variant)', fontWeight: '500', opacity: 0.7, position: 'relative' }}>
              <Bell size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0.5rem', left: '1.75rem', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.6rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontWeight: '600', width: '100%', borderRadius: 'var(--radius-md)', opacity: 0.8 }}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
