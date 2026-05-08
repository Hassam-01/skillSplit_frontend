import { Fragment, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Zap, Info, RefreshCw, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useOptimization } from '../hooks/useOptimization';
import { useGroups } from '../hooks/useGroups';
import type { OptimizedPlanStep, Profile } from '../types/database';

type StepDetail = {
  from: string;
  to: string;
  fromName?: string | null;
  toName?: string | null;
  expenseId: string;
  description: string | null;
  amount: number;
};

const OptimizationCenter = () => {
  const { groups, loading: groupsLoading } = useGroups();
  const [searchParams] = useSearchParams();
  const queryGroupId = searchParams.get('groupId');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const { plan, loading, error, fetchLatestPlan, generatePlan, confirmPlan, settleStep } = useOptimization(selectedGroupId || undefined);

  useEffect(() => {
    if (groups.length > 0) {
      if (queryGroupId && groups.some(g => g.id === queryGroupId)) {
        setSelectedGroupId(queryGroupId);
      } else if (!selectedGroupId) {
        setSelectedGroupId(groups[0].id);
      }
    }
  }, [groups, queryGroupId, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) fetchLatestPlan();
  }, [selectedGroupId, fetchLatestPlan]);

  const steps = (plan?.steps ?? []) as unknown as (OptimizedPlanStep & { payer: Profile; payee: Profile; details?: StepDetail[] })[];
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const confirmedSteps = steps.filter(s => s.settlement_id);
  const efficiency = plan?.naive_count && plan?.naive_count > 0 
    ? Math.round((1 - (plan.optimized_count ?? 0) / plan.naive_count) * 100) 
    : 0;

  return (
    <div className="container" style={{ paddingBottom: '1.5rem' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 className="text-display-lg">Optimization Center</h2>
        <p className="text-body-lg" style={{ maxWidth: '560px', marginTop: '0.35rem', fontSize: '0.9rem' }}>
          Minimize transactions and settle group balances efficiently through consolidated debt optimization.
        </p>
      </header>

      {/* Group Selector */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '360px', position: 'relative' }}>
        <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Select Active Group</label>
        {groupsLoading ? (
          <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)' }}>Loading groups…</div>
        ) : groups.length === 0 ? (
          <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)' }}>No groups found.</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <select 
              value={selectedGroupId} 
              onChange={e => setSelectedGroupId(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.85rem 2.8rem 0.85rem 1rem', 
                backgroundColor: 'var(--color-surface-container-low)', 
                border: '1px solid var(--color-outline-variant)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.92rem', 
                appearance: 'none', 
                cursor: 'pointer', 
                fontFamily: 'var(--font-body)', 
                outline: 'none',
                color: 'var(--color-on-surface)',
                fontWeight: '500'
              }}
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown size={20} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--color-error-container)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', color: 'var(--color-error)', border: '1px solid rgba(186,26,26,0.2)' }}>
          <AlertCircle size={20} /><p style={{ fontWeight: '500' }}>{error}</p>
        </div>
      )}

      <div className="grid-asymmetric" style={{ gap: '1rem', alignItems: 'start' }}>
        <section>
          {/* Algorithm Status Card */}
          <div className="surface-lowest" style={{ padding: '1.15rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', border: '1px solid var(--color-surface-container-high)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="text-headline-lg" style={{ fontSize: '1.05rem' }}>Smart Settle</h3>
                {plan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', marginTop: '0.35rem' }}>
                    <ShieldCheck size={16} />
                    <span className="text-label-sm" style={{ fontSize: '0.7rem' }}>{plan.is_confirmed ? 'Plan Confirmed' : 'Analysis Complete'}</span>
                  </div>
                )}
              </div>
              {plan && (
                <div style={{ textAlign: 'right' }}>
                  <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Efficiency Gain</p>
                  <p style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-primary)' }}>{efficiency}%</p>
                </div>
              )}
            </div>

            {plan ? (
              <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.95rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--color-outline-variant)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-on-surface-variant)', opacity: 0.75 }}>{plan.naive_count ?? '?'}</div>
                    <p className="text-label-sm">Standard Path</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ArrowRight size={18} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                    <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-primary)', lineHeight: 1 }}>{plan.optimized_count ?? steps.length}</div>
                    <p className="text-label-sm" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Optimized Steps</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.4rem 1rem', color: 'var(--color-on-surface-variant)', border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <RefreshCw size={24} style={{ margin: '0 auto 0.65rem', opacity: 0.35 }} />
                <p style={{ fontSize: '0.96rem', fontWeight: '600' }}>Ready to optimize group debts</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Generate a compact settlement plan.</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button className="btn-gradient" onClick={generatePlan} disabled={loading || !selectedGroupId} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.55rem 1rem', fontSize: '0.84rem' }}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> 
                {loading ? 'Analyzing Data…' : 'Generate Optimization'}
              </button>
              {plan && !plan.is_confirmed && (
                <button className="btn-secondary" onClick={confirmPlan} disabled={loading} style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}>
                  Lock & Confirm Plan
                </button>
              )}
            </div>
          </div>

          {/* Payment Steps Section */}
          {steps.length > 0 && (
            <div style={{ animation: 'slideIn 0.4s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
                <h3 className="text-title-lg">Recommended Settlements</h3>
                <span className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {confirmedSteps.length} of {steps.length} Complete
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {steps.map((step) => {
                  const payer = step.payer as Profile | null;
                  const payee = step.payee as Profile | null;
                  const settled = !!step.settlement_id;
                  const details = (step as any).details as StepDetail[] | undefined;
                  const expanded = expandedStepId === step.id;
                  
                  return (
                    <Fragment key={step.id}>
                    <div 
                      key={step.id} 
                      className="surface-lowest" 
                      style={{ 
                        padding: '0.9rem 1rem', 
                        borderRadius: 'var(--radius-md)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)', 
                        opacity: settled ? 0.5 : 1,
                        borderLeft: settled ? '4px solid var(--color-success)' : '4px solid var(--color-primary)',
                        transition: 'all 0.3s ease',
                        flexWrap: 'wrap',
                        gap: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: '220px' }}>
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{payer?.display_name ?? 'Unknown'}</p>
                          <p className="text-label-sm" style={{ fontSize: '0.6rem', color: 'var(--color-on-surface-variant)' }}>Payer</p>
                        </div>
                        
                        <div style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <div style={{ height: '2px', width: '100%', backgroundColor: 'var(--color-surface-container-high)', position: 'absolute', top: '50%', zIndex: 0 }}></div>
                          <div style={{ backgroundColor: 'var(--color-surface)', padding: '0 0.5rem', zIndex: 1, color: 'var(--color-primary)' }}>
                             <ArrowRight size={18} />
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{payee?.display_name ?? 'Unknown'}</p>
                          <p className="text-label-sm" style={{ fontSize: '0.6rem', color: 'var(--color-on-surface-variant)' }}>Recipient</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p className="text-label-sm" style={{ fontSize: '0.55rem', color: 'var(--color-on-surface-variant)' }}>Settlement Amount</p>
                          <p style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                            Rs. {Number(step.amount).toLocaleString()}
                          </p>
                        </div>
                        
                        {settled ? (
                          <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem' }}>
                            <CheckCircle2 size={20} /> Verified
                          </div>
                        ) : (
                          <button 
                            className="btn-gradient" 
                            style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem', minWidth: '88px' }} 
                            onClick={() => settleStep(step as unknown as OptimizedPlanStep)} 
                            disabled={loading}
                          >
                            Pay Now
                          </button>
                        )}
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                          onClick={() => setExpandedStepId(expanded ? null : step.id)}
                        >
                          {expanded ? 'Hide details' : 'Show details'}
                        </button>
                      </div>
                    </div>
                    {details && details.length > 0 && expanded && (
                      <div style={{ marginTop: '0.75rem', padding: '0.9rem 1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', width: '100%', border: '1px solid var(--color-outline-variant)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Why this settlement exists</div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                            {details.map((d) => (
                              <li key={`${step.id}-${d.expenseId}-${d.from}-${d.to}`} style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                "{d.description ?? 'Untitled'}" — Rs. {Number(d.amount).toLocaleString()} — {d.fromName ?? d.from} → {d.toName ?? d.to}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700 }}>
                          Net settlement: Rs. {Number(step.amount).toLocaleString()}
                        </div>
                      </div>
                    )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <aside style={{ alignSelf: 'start' }}>
          <div className="surface-high" style={{ padding: '1.15rem', borderRadius: 'var(--radius-xl)', position: 'sticky', top: '1rem', border: '1px solid var(--color-outline-variant)' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '1rem' }}>
              <Info size={20} style={{ color: 'var(--color-primary)' }} /> How it works
            </h3>
            <p className="text-body-lg" style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', lineHeight: '1.55' }}>
              Our proprietary <strong>Smart Settle</strong> algorithm analyzes every expense in your group to find the absolute minimum number of payments required.
            </p>
            <ul style={{ padding: 0, marginTop: '0.9rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>01</div>
                  <p>Preserves everyone's net position exactly—no one pays more than they owe.</p>
               </li>
               <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>02</div>
                  <p>Eliminates redundant "circular" payments between friends.</p>
               </li>
               <li style={{ display: 'flex', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>03</div>
                  <p>Reduces JazzCash/EasyPaisa transaction fees by consolidating amounts.</p>
               </li>
            </ul>

            {plan && (
              <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-outline-variant)' }}>
                <p className="text-label-sm" style={{ marginBottom: '0.65rem', color: 'var(--color-primary)' }}>Live Statistics</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem', fontSize: '0.82rem' }}>
                  <span>Completed</span>
                  <span style={{ fontWeight: '700', color: 'var(--color-success)' }}>{confirmedSteps.length} / {steps.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span>Status</span>
                  <span style={{ fontWeight: '700', color: plan.is_confirmed ? 'var(--color-success)' : 'var(--color-on-surface-variant)' }}>
                    {plan.is_confirmed ? 'LOCKED' : 'DRAFT'}
                  </span>
                </div>
                
                <div style={{ marginTop: '0.85rem', height: '6px', backgroundColor: 'var(--color-surface-container-highest)', borderRadius: '10px', overflow: 'hidden' }}>
                   <div style={{ width: `${(confirmedSteps.length / (steps.length || 1)) * 100}%`, height: '100%', backgroundColor: 'var(--color-success)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 600px) {
          .container { padding: 1rem !important; }
          .text-display-lg { font-size: 1.75rem !important; }
        }
      `}} />
    </div>
  );
};

export default OptimizationCenter;
