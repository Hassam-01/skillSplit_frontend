import { useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageSquare, ShieldAlert, AlertCircle } from 'lucide-react';
import { useDisputes } from '../hooks/useDisputes';
import type { DisputeWithDetail } from '../hooks/useDisputes';

const Disputes = () => {
  const { disputes, loading, error, resolveDispute, dismissDispute } = useDisputes();
  const [mediatingId, setMediatingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'pending');
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length;

  const handleResolve = async (id: string) => {
    if (!resolutionNote.trim()) return;
    setActionLoading(true);
    await resolveDispute(id, resolutionNote.trim());
    setMediatingId(null);
    setResolutionNote('');
    setActionLoading(false);
  };

  const handleDismiss = async (id: string) => {
    setActionLoading(true);
    await dismissDispute(id);
    setActionLoading(false);
  };

  const getStatusColor = (status: string) => {
    if (status === 'open' || status === 'pending') return 'var(--color-error)';
    if (status === 'reviewing') return 'var(--color-tertiary-container)';
    return 'var(--color-success)';
  };

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 className="text-headline-lg">Mediation Panel</h2>
        <p className="text-body-lg" style={{ fontSize: '0.85rem' }}>Review and resolve flagged expenses. Maintain fairness through transparent mediation.</p>
      </header>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '10px' }}>
            <ShieldAlert size={18} color="var(--color-error)" />
          </div>
          <div>
            <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Active Disputes</p>
            <h3 style={{ fontSize: '1.5rem' }}>{loading ? '…' : openDisputes.length}</h3>
          </div>
        </div>
        <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '10px' }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
          </div>
          <div>
            <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Resolved Total</p>
            <h3 style={{ fontSize: '1.5rem' }}>{loading ? '…' : resolvedCount}</h3>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      <section>
        <h3 className="text-title-lg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <AlertTriangle size={18} color="var(--color-error)" /> Flagged Expenses
        </h3>

        {loading ? (
          <div style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '3rem' }}>Loading disputes…</div>
        ) : disputes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-on-surface-variant)' }}>
            <CheckCircle2 size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: '600' }}>No disputes found</p>
            <p style={{ fontSize: '0.9rem' }}>All your group expenses are dispute-free!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {disputes.map((dispute: DisputeWithDetail) => {
              const isMediating = mediatingId === dispute.id;
              return (
                <div key={dispute.id} className="surface-lowest" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem' }}>{dispute.expenseDescription ?? 'Unknown Expense'}</h4>
                      <span className="text-label-sm" style={{ padding: '0.125rem 0.5rem', borderRadius: '4px', backgroundColor: getStatusColor(dispute.status), color: 'white', fontSize: '0.6rem' }}>
                        {dispute.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700' }}>{dispute.raisedByName}</span> in <span style={{ fontWeight: '600' }}>{dispute.groupName ?? 'Unknown Group'}</span>
                    </p>
                    {dispute.reason && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)' }}>
                        <MessageSquare size={14} style={{ marginTop: '0.125rem' }} />
                        <p style={{ fontSize: '0.85rem' }}>{dispute.reason}</p>
                      </div>
                    )}
                    {isMediating && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <input type="text" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Enter resolution note…"
                          style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', outline: 'none', fontFamily: 'var(--font-body)', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-gradient" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleResolve(dispute.id)} disabled={actionLoading}>{actionLoading ? '…' : 'Mark Resolved'}</button>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setMediatingId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {dispute.resolution_note && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginTop: '0.5rem', fontStyle: 'italic' }}>Resolution: {dispute.resolution_note}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                      <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Amount</p>
                      <p style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--color-primary)' }}>Rs. {Number(dispute.expenseAmount ?? 0).toLocaleString()}</p>
                    </div>
                    {(dispute.status === 'open' || dispute.status === 'pending') && (
                      <>
                        <button className="btn-gradient" style={{ padding: '0.4rem' }} onClick={() => { setMediatingId(dispute.id); setResolutionNote(''); }}>Mediate</button>
                        <button className="btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleDismiss(dispute.id)} disabled={actionLoading}>Dismiss</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Disputes;
