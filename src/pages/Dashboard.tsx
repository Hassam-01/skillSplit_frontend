import { ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle, Users, Bell, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../contexts/AuthContext';
import type { Expense } from '../types/database';

const CATEGORY_EMOJI: Record<string, string> = {
  dining: '🍽️', food: '🍽️', transport: '🚗', travel: '✈️',
  entertainment: '🎬', shopping: '🛍️', utilities: '💡', health: '🏥',
  sightseeing: '🏛️', other: '📦',
};

const getCategoryEmoji = (cat: string | null) => CATEGORY_EMOJI[cat?.toLowerCase() ?? ''] ?? '📦';

const formatAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
  if (diffHrs < 48) return 'Yesterday';
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { recentExpenses, stats, loading, error, refetch } = useExpenses();
  const navigate = useNavigate();

  const greeting = profile?.display_name ? `Hey, ${profile.display_name.split(' ')[0]}!` : 'Dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 className="text-headline-lg" style={{ marginBottom: '0.2rem' }}>{greeting}</h2>
          <p className="text-body-lg" style={{ fontSize: '0.88rem' }}>Overview of your balances and latest transactions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.9rem' }} onClick={() => navigate('/notifications')}>
            <div style={{ position: 'relative' }}>
              <Bell size={18} />
              {stats.pendingSettlementsCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: 'var(--color-error)', borderRadius: '50%' }} />
              )}
            </div>
            <span className="lg-show">Notifications</span>
          </button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.9rem' }} onClick={() => navigate('/profile')}>
            <User size={18} />
            <span className="lg-show">Profile</span>
          </button>
        </div>
      </header>


      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.8rem' }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="surface-lowest" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', height: '86px', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : ([
          { label: 'Net Balance', value: stats.totalBalance, color: stats.totalBalance >= 0 ? 'var(--color-primary)' : 'var(--color-error)', icon: null },
          { label: 'You are owed', value: stats.youAreOwed, color: 'var(--color-success)', icon: <ArrowUpRight size={20} /> },
          { label: 'You owe', value: stats.youOwe, color: 'var(--color-error)', icon: <ArrowDownLeft size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} className="surface-lowest" style={{ padding: '0.95rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.45rem' }}>{stat.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: stat.color }}>Rs. {Math.abs(stat.value).toLocaleString()}</h3>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            {idx === 1 && <p className="text-label-sm" style={{ marginTop: '0.5rem', color: 'var(--color-on-surface-variant)' }}>Across {stats.groupCount} groups</p>}
          </div>
        )))}
      </section>

      <section>
        <div className="surface-low" style={{ padding: '1.1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)', display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 className="text-title-lg">Recent Activity</h3>
            <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/optimize')} style={{ background: 'none', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                Optimize Debts
              </button>
              <button onClick={() => navigate('/disputes')} style={{ background: 'none', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                Review Disputes
              </button>
              <button onClick={refetch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center' }} title="Refresh">
                <RefreshCw size={16} />
              </button>
              <Link to="/activity" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '2rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-on-surface-variant)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No expenses yet</p>
              <p style={{ fontSize: '0.875rem' }}>Create a group and add your first expense!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', paddingRight: '0.3rem', flex: 1, minHeight: 0 }}>
              {recentExpenses.map((expense: Expense) => {
                const paidByMe = expense.paid_by === user?.id;
                const myParticipant = expense.expense_participants?.find(ep => ep.user_id === user?.id);
                const myShare = myParticipant?.share_amount ?? 0;
                const payerName = (expense.profiles as { display_name: string | null } | null)?.display_name ?? 'Someone';
                const groupName = (expense.groups as { name: string } | null)?.name ?? '';
                return (
                  <div key={expense.id} className="surface-lowest" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                        {getCategoryEmoji(expense.category)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: '600', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expense.description}</p>
                        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {groupName} • {formatAgo(expense.created_at)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: '700', fontSize: '0.9rem', color: paidByMe ? 'var(--color-success)' : 'var(--color-on-surface)' }}>
                        {paidByMe ? '+' : '-'} Rs. {(paidByMe ? Number(expense.amount) - myShare : myShare).toLocaleString()}
                      </p>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.68rem' }}>
                        Paid by {paidByMe ? 'You' : payerName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          section[style*='grid-template-columns: repeat(3, minmax(0, 1fr))'] {
            grid-template-columns: 1fr !important;
          }
          .lg-show {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
