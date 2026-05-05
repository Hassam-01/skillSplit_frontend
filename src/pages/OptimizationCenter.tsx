import { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Zap, Info, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import { useOptimization } from '../hooks/useOptimization';
import { useGroups } from '../hooks/useGroups';
import type { OptimizedPlanStep, Profile } from '../types/database';

const OptimizationCenter = () => {
  const { groups, loading: groupsLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const { plan, loading, error, fetchLatestPlan, generatePlan, confirmPlan, settleStep } = useOptimization(selectedGroupId || undefined);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) fetchLatestPlan();
  }, [selectedGroupId, fetchLatestPlan]);

  const steps = (plan?.steps ?? []) as unknown as (OptimizedPlanStep & { payer: Profile; payee: Profile })[];
  const confirmedSteps = steps.filter(s => s.settlement_id);

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 className="text-headline-lg">Optimization Center</h2>
        <p className="text-body-lg" style={{ maxWidth: '600px', fontSize: '0.85rem' }}>
          Minimize transactions and settle group balances efficiently through consolidated debt optimization.
        </p>
      </header>

      {/* Group Selector */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '320px', position: 'relative' }}>
        <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Group</label>
        {groupsLoading ? (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>Loading…</div>
        ) : groups.length === 0 ? (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)', fontSize: '0.9rem' }}>No groups yet. Create a group first.</div>
        ) : (
          <>
            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', backgroundColor: 'var(--color-surface-container-low)', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', appearance: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', outline: 'none' }}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', bottom: '0.75rem', pointerEvents: 'none', color: 'var(--color-on-surface-variant)' }} />
          </>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        <section>
          {/* Algorithm Status */}
          <div className="surface-low" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 className="text-title-lg">Algorithm Status</h3>
                {plan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b5e20', marginTop: '0.25rem' }}>
                    <ShieldCheck size={16} />
                    <span className="text-label-sm" style={{ fontSize: '0.6rem' }}>{plan.is_confirmed ? 'Confirmed' : 'Smart Settle Active'}</span>
                  </div>
                )}
              </div>
              {plan && (
                <p className="text-body-lg" style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', textAlign: 'right' }}>
                  Reducing {plan.naive_count ?? '?'} possible transactions to {plan.optimized_count ?? steps.length} direct payments.
                </p>
              )}
            </div>

            {plan ? (
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-on-surface-variant)', opacity: 0.4 }}>{plan.naive_count ?? '?'}</div>
                  <p className="text-label-sm">Original</p>
                </div>
                <ArrowRight size={24} style={{ color: 'var(--color-outline-variant)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--color-primary)' }}>{plan.optimized_count ?? steps.length}</div>
                  <p className="text-label-sm" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Optimized</p>
                </div>
                {plan.naive_count && plan.optimized_count ? (
                  <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-md)', marginLeft: '1.5rem' }}>
                    <p className="text-label-sm" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem' }}>
                      <Zap size={14} /> Efficiency Gain
                    </p>
                    <p style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                      {plan.naive_count > 0 ? Math.round((1 - plan.optimized_count / plan.naive_count) * 100) : 0}% Fewer Steps
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>No optimization plan generated yet for this group.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-gradient" onClick={generatePlan} disabled={loading || !selectedGroupId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={16} /> {loading ? 'Generating…' : 'Generate New Plan'}
              </button>
              {plan && !plan.is_confirmed && (
                <button className="btn-secondary" onClick={confirmPlan} disabled={loading}>Confirm Plan</button>
              )}
            </div>
          </div>

          {/* Payment Steps */}
          {steps.length > 0 && (
            <>
              <h3 className="text-title-lg" style={{ marginBottom: '1rem' }}>Recommended Payments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {steps.map(step => {
                  const payer = step.payer as Profile | null;
                  const payee = step.payee as Profile | null;
                  const settled = !!step.settlement_id;
                  return (
                    <div key={step.id} className="surface-lowest" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', opacity: settled ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontWeight: '600' }}>{payer?.display_name ?? 'Unknown'}</p>
                          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Payer</p>
                        </div>
                        <ArrowRight size={20} style={{ color: 'var(--color-primary)' }} />
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontWeight: '600' }}>{payee?.display_name ?? 'Unknown'}</p>
                          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Recipient</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)' }}>Rs. {Number(step.amount).toLocaleString()}</p>
                        {settled ? (
                          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(27,94,32,0.1)', color: '#1b5e20', borderRadius: '100px', fontWeight: '600' }}>Settled</span>
                        ) : (
                          <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => settleStep(step as unknown as OptimizedPlanStep)} disabled={loading}>Settle</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <aside>
          <div className="surface-high" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Info size={16} /> How it works
            </h3>
            <p className="text-body-lg" style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
              Our greedy algorithm consolidates complex debts into the fewest possible payments. Net positions are preserved — only the payment paths are optimized.
            </p>
            {plan && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-outline-variant)' }}>
                <p className="text-label-sm" style={{ marginBottom: '0.75rem' }}>Plan Status</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span>Steps settled</span>
                  <span style={{ fontWeight: '600', color: '#1b5e20' }}>{confirmedSteps.length} / {steps.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Confirmed</span>
                  <span style={{ fontWeight: '600', color: plan.is_confirmed ? '#1b5e20' : 'var(--color-on-surface-variant)' }}>{plan.is_confirmed ? 'Yes' : 'No'}</span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OptimizationCenter;
