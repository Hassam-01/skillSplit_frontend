import { useState } from 'react';
import { Calendar, User, MoreVertical, ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useGroupDetail } from '../hooks/useGroupDetail';
import { useAuth } from '../contexts/AuthContext';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';
import { supabase } from '../utils/supabase';
import type { Expense, Profile, GroupMember } from '../types/database';

const CATEGORY_EMOJI: Record<string, string> = { dining: '🍽️', food: '🍽️', transport: '🚗', travel: '✈️', entertainment: '🎬', shopping: '🛍️', utilities: '💡', health: '🏥', sightseeing: '🏛️', other: '📦' };
const getCatEmoji = (cat: string | null) => CATEGORY_EMOJI[cat?.toLowerCase() ?? ''] ?? '📦';

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useGroupDetail(id);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [raiseDisputeId, setRaiseDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  const handleRaiseDispute = async (expenseId: string) => {
    if (!user || !disputeReason.trim()) return;
    setDisputeLoading(true);
    await supabase.from('disputes').insert({ expense_id: expenseId, raised_by: user.id, reason: disputeReason.trim() });
    setRaiseDisputeId(null);
    setDisputeReason('');
    setDisputeLoading(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Soft-delete this expense?')) return;
    await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', expenseId);
    refetch();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-on-surface-variant)' }}>Loading group…</div>;
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>
      <AlertCircle size={20} /><p>{error}</p>
    </div>
  );
  if (!data) return null;

  const createdDate = new Date(data.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <Link to="/groups" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-on-surface-variant)', textDecoration: 'none', marginBottom: '2rem', fontWeight: '600' }}>
        <ArrowLeft size={20} /> Back to Groups
      </Link>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 className="text-headline-lg">{data.name}</h2>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {data.members.length} Member{data.members.length !== 1 ? 's' : ''} • Created {createdDate}
          </p>
          {data.description && <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{data.description}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.125rem' }}>Total Spending</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Rs. {data.totalSpending.toLocaleString()}</h3>
        </div>
      </header>

      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} onSaved={() => { setIsExpenseOpen(false); refetch(); }} groupId={id} groupMembers={data.members as GroupMember[]} />
      <SettleUpModal isOpen={isSettleOpen} onClose={() => setIsSettleOpen(false)} onSettled={() => { setIsSettleOpen(false); refetch(); }} groupId={id!} memberBalances={data.memberBalances} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="text-title-lg">Expenses</h3>
            <button className="btn-gradient" style={{ padding: '0.5rem 1.5rem' }} onClick={() => setIsExpenseOpen(true)}>Add New</button>
          </div>

          {data.expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-on-surface-variant)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</p>
              <p style={{ fontWeight: '600' }}>No expenses yet</p>
              <p style={{ fontSize: '0.9rem' }}>Add the first expense for this group!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {data.expenses.map((expense: Expense) => {
                const myParticipant = expense.expense_participants?.find(ep => ep.user_id === user?.id);
                const payerProfile = expense.profiles as Profile | null;
                const paidByMe = expense.paid_by === user?.id;
                const isDisputing = raiseDisputeId === expense.id;
                return (
                  <div key={expense.id} className="surface-lowest" style={{ padding: '1.5rem 2rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                          {getCatEmoji(expense.category)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{expense.description}</h4>
                          <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={14} /> {new Date(expense.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <User size={14} /> {paidByMe ? 'You paid' : `${payerProfile?.display_name ?? 'Someone'} paid`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total</p>
                          <p style={{ fontWeight: '700', fontSize: '1rem' }}>Rs. {Number(expense.amount).toLocaleString()}</p>
                        </div>
                        {myParticipant && (
                          <div style={{ textAlign: 'right' }}>
                            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Your Share</p>
                            <p style={{ fontWeight: '700', fontSize: '1rem', color: paidByMe ? '#1b5e20' : 'var(--color-primary)' }}>
                              Rs. {Number(myParticipant.share_amount).toLocaleString()}
                            </p>
                          </div>
                        )}
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setRaiseDisputeId(isDisputing ? null : expense.id)} style={{ background: 'none', border: 'none', color: 'var(--color-outline-variant)', cursor: 'pointer' }}>
                            <MoreVertical size={20} />
                          </button>
                          {isDisputing && (
                            <div style={{ position: 'absolute', right: 0, top: '2rem', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '0.5rem', zIndex: 10, minWidth: '160px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                              <button onClick={() => handleDeleteExpense(expense.id)} style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--color-error)', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}>Delete Expense</button>
                              <button onClick={() => setRaiseDisputeId(`dispute-${expense.id}`)} style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                                <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Raise Dispute
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {raiseDisputeId === `dispute-${expense.id}` && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                        <input type="text" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the issue…"
                          style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: 'white', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-body)', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-gradient" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleRaiseDispute(expense.id)} disabled={disputeLoading}>{disputeLoading ? '…' : 'Submit'}</button>
                          <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => setRaiseDisputeId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside>
          <div className="surface-high" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1.5rem' }}>Balances</h3>
            {data.memberBalances.length === 0 ? (
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>All settled up!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {data.memberBalances.map(mb => (
                  <div key={mb.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{mb.displayName}</p>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {mb.netBalance > 0.01 ? 'owes you' : mb.netBalance < -0.01 ? 'you owe' : 'settled'}
                      </p>
                    </div>
                    <p style={{ fontWeight: '700', color: mb.netBalance > 0.01 ? '#1b5e20' : mb.netBalance < -0.01 ? '#b71c1c' : 'var(--color-on-surface)' }}>
                      Rs. {Math.abs(mb.netBalance).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-gradient" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setIsSettleOpen(true)}>Settle Up</button>
          </div>

          <div className="surface-low" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1rem' }}>Group Info</h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Type</span><span style={{ fontWeight: '600', color: 'var(--color-on-surface)' }}>{data.group_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Members</span><span style={{ fontWeight: '600', color: 'var(--color-on-surface)' }}>{data.members.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expenses</span><span style={{ fontWeight: '600', color: 'var(--color-on-surface)' }}>{data.expenses.length}</span>
              </div>
            </div>
            {data.invite_token && (
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.25rem' }}>Invite Token</p>
                <p style={{ fontSize: '0.8rem', fontWeight: '600', wordBreak: 'break-all', color: 'var(--color-primary)' }}>{data.invite_token}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GroupDetail;
