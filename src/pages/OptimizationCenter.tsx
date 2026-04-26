import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Info } from 'lucide-react';

const OptimizationCenter = () => {
  const optimizedPayments = [
    { from: 'Ali Khan', to: 'You', amount: '5,000', method: 'Bank Transfer' },
    { from: 'You', to: 'Zain Malik', amount: '2,500', method: 'EasyPaisa' },
    { from: 'Sana Ahmed', to: 'Zain Malik', amount: '1,200', method: 'Bank Transfer' },
  ];

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 className="text-headline-lg">Optimization Center</h2>
        <p className="text-body-lg" style={{ maxWidth: '600px', fontSize: '0.85rem' }}>
          Minimize transactions and settle group balances efficiently through consolidated debt optimization.
        </p>
      </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
          <section>
            <div className="surface-low" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 className="text-title-lg">Algorithm Status</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1b5e20', marginTop: '0.25rem' }}>
                    <ShieldCheck size={16} />
                    <span className="text-label-sm" style={{ fontSize: '0.6rem' }}>Smart Settle Active</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="text-body-lg" style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                    Reducing 12 transactions to 3 direct payments.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-on-surface-variant)', opacity: 0.4 }}>12</div>
                  <p className="text-label-sm">Original</p>
                </div>
                <ArrowRight size={24} style={{ color: 'var(--color-outline-variant)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--color-primary)' }}>3</div>
                  <p className="text-label-sm" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>Optimized</p>
                </div>
                <div style={{ flex: 1, padding: '1rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: 'var(--radius-md)', marginLeft: '1.5rem' }}>
                  <p className="text-label-sm" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6rem' }}>
                    <Zap size={14} /> Efficiency Gain
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '700' }}>75% Fewer Steps</p>
                </div>
              </div>
            </div>

            <h3 className="text-title-lg" style={{ marginBottom: '1rem' }}>Recommended Payments</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {optimizedPayments.map((payment, idx) => (
                <div key={idx} className="surface-lowest" style={{ 
                  padding: '1rem 1.5rem', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: '600' }}>{payment.from}</p>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Sender</p>
                  </div>
                  <ArrowRight size={20} style={{ color: 'var(--color-primary)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: '600' }}>{payment.to}</p>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Recipient</p>
                  </div>
                </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary)' }}>Rs. {payment.amount}</p>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.6rem' }}>Via {payment.method}</p>
                  </div>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Settle</button>
                </div>
              ))}
            </div>
          </section>

          <aside>
            <div className="surface-high" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
              <h3 className="text-title-lg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} />
                How it works?
              </h3>
              <p className="text-body-lg" style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', lineHeight: '1.6' }}>
                Our algorithm consolidates complex debts into fewer payments by shifting obligations without changing net totals.
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-outline-variant)' }}>
                <p className="text-label-sm" style={{ marginBottom: '0.75rem' }}>Net Position</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span>Receivable</span>
                  <span style={{ fontWeight: '600', color: '#1b5e20' }}>Rs. 32,450</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Payable</span>
                  <span style={{ fontWeight: '600', color: '#b71c1c' }}>Rs. 17,950</span>
                </div>
              </div>
            </div>
          </aside>
      </div>
    </div>
  );
};

export default OptimizationCenter;
