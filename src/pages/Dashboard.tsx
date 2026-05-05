import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, AlertCircle, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AddExpenseModal from '../components/AddExpenseModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const greeting = profile?.display_name ? `Hey, ${profile.display_name.split(' ')[0]}!` : 'Dashboard';

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="text-headline-lg">{greeting}</h2>
          <p className="text-body-lg">Your financial footprint across all endeavors.</p>
        </div>
        <button className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Add Expense
        </button>
      </header>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={() => { setIsModalOpen(false); refetch(); }} />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="surface-lowest" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', height: '80px', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : ([
          { label: 'Net Balance', value: stats.totalBalance, color: stats.totalBalance >= 0 ? 'var(--color-primary)' : 'var(--color-error)', icon: null },
          { label: 'You are owed', value: stats.youAreOwed, color: 'var(--color-success)', icon: <ArrowUpRight size={20} /> },
          { label: 'You owe', value: stats.youOwe, color: 'var(--color-error)', icon: <ArrowDownLeft size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} className="surface-lowest" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.5rem' }}>{stat.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: stat.color }}>Rs. {Math.abs(stat.value).toLocaleString()}</h3>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            {idx === 1 && <p className="text-label-sm" style={{ marginTop: '0.5rem', color: 'var(--color-on-surface-variant)' }}>Across {stats.groupCount} groups</p>}
          </div>
        )))}
      </section>

      <section className="grid-asymmetric" style={{ gap: '2rem' }}>
        {/* Recent Activity */}
        <div className="surface-low" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="text-title-lg">Recent Activity</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={refetch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center' }} title="Refresh">
                <RefreshCw size={16} />
              </button>
              <Link to="/activity" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', fontSize: '0.875rem' }}>View All</Link>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '2rem' }}>Loading…</div>
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-on-surface-variant)' }}>
              <Users size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No expenses yet</p>
              <p style={{ fontSize: '0.875rem' }}>Create a group and add your first expense!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {recentExpenses.map((expense: Expense) => {
                const paidByMe = expense.paid_by === user?.id;
                const myParticipant = expense.expense_participants?.find(ep => ep.user_id === user?.id);
                const myShare = myParticipant?.share_amount ?? 0;
                const payerName = (expense.profiles as { display_name: string | null } | null)?.display_name ?? 'Someone';
                const groupName = (expense.groups as { name: string } | null)?.name ?? '';
                return (
                  <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--color-surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                        {getCategoryEmoji(expense.category)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '1rem' }}>{expense.description}</p>
                        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                          {groupName} • {formatAgo(expense.created_at)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '700', fontSize: '1rem', color: paidByMe ? 'var(--color-success)' : 'var(--color-on-surface)' }}>
                        {paidByMe ? '+' : '-'} Rs. {(paidByMe ? Number(expense.amount) - myShare : myShare).toLocaleString()}
                      </p>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Paid by {paidByMe ? 'You' : payerName}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Summary */}
        <div className="surface-high" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', height: 'fit-content' }}>
          <h3 className="text-title-lg" style={{ marginBottom: '1.5rem' }}>Quick Summary</h3>
          <p style={{ marginBottom: '2rem', color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>
            {stats.pendingSettlementsCount > 0 || stats.openDisputesCount > 0
              ? `You have ${stats.pendingSettlementsCount > 0 ? `${stats.pendingSettlementsCount} pending settlement${stats.pendingSettlementsCount !== 1 ? 's' : ''}` : ''}${stats.pendingSettlementsCount > 0 && stats.openDisputesCount > 0 ? ' and ' : ''}${stats.openDisputesCount > 0 ? `${stats.openDisputesCount} open dispute${stats.openDisputesCount !== 1 ? 's' : ''}` : ''}.`
              : 'Everything looks settled. Great job!'}
          </p>
          <button className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => navigate('/optimize')}>
            Optimize Debts
          </button>
          <button onClick={() => navigate('/disputes')} style={{ width: '100%', padding: '1rem', background: 'none', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}>
            Review Disputes
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
