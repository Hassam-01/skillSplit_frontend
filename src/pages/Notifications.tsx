import { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, Clock, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types/database';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: nErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (nErr) throw nErr;
      setNotifications(data || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-PK', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 className="text-display-lg">Notifications</h2>
          <p className="text-body-lg" style={{ marginTop: '0.5rem' }}>Stay updated on your splits and settlements.</p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={fetchNotifications} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Bell size={18} />}
          Refresh
        </button>
      </header>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader size={40} className="animate-spin" style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
          <p style={{ marginTop: '1rem', color: 'var(--color-on-surface-variant)' }}>Fetching notifications…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="surface-lowest" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--radius-xl)' }}>
          <BellOff size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--color-on-surface-variant)' }}>You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className="surface-lowest" 
              style={{ 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-lg)', 
                borderLeft: n.is_read ? '4px solid transparent' : '4px solid var(--color-primary)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                backgroundColor: n.is_read ? 'var(--color-surface-container-high)' : 'var(--color-primary-container)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: n.is_read ? 'var(--color-on-surface-variant)' : 'var(--color-primary)',
                flexShrink: 0
              }}>
                {n.type === 'settlement' ? <CheckCircle2 size={20} /> : <Bell size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {formatTime(n.created_at)}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-on-surface-variant)', lineHeight: '1.5' }}>{n.body}</p>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: 0, opacity: 0.7 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
