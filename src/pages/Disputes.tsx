import { AlertTriangle, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';

const Disputes = () => {
  const disputes = [
    { 
      id: 1, 
      title: 'Dinner at Monal', 
      flaggedBy: 'Zara Ahmed', 
      group: 'Islamabad Trip', 
      amount: '12,500', 
      reason: 'Incorrect splitting method used.', 
      status: 'pending' 
    },
    { 
      id: 2, 
      title: 'Rent-a-Car Fuel', 
      flaggedBy: 'Usman', 
      group: 'Northern Areas Trip', 
      amount: '8,000', 
      reason: 'Missing receipt verification.', 
      status: 'reviewing' 
    }
  ];

  return (
    <div>
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 className="text-headline-lg">Mediation Panel</h2>
        <p className="text-body-lg" style={{ fontSize: '0.85rem' }}>Review and resolve flagged expenses within your groups. Maintain fairness through transparent mediation.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '10px' }}>
            <ShieldAlert size={18} color="var(--color-error)" />
          </div>
          <div>
            <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Active Disputes</p>
            <h3 style={{ fontSize: '1.25rem' }}>3</h3>
          </div>
        </div>
        <div className="surface-low" style={{ padding: '1rem', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '10px' }}>
            <CheckCircle2 size={18} color="#1b5e20" />
          </div>
          <div>
            <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Resolved This Month</p>
            <h3 style={{ fontSize: '1.25rem' }}>12</h3>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-title-lg" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <AlertTriangle size={18} color="var(--color-error)" />
          Flagged Expenses
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.map((dispute) => (
            <div key={dispute.id} className="surface-lowest" style={{ 
              padding: '1rem', 
              borderRadius: 'var(--radius-xl)',
              display: 'grid',
              gridTemplateColumns: '1fr 180px',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>{dispute.title}</h4>
                  <span className="text-label-sm" style={{ 
                    padding: '0.125rem 0.5rem', 
                    borderRadius: '4px', 
                    backgroundColor: dispute.status === 'pending' ? 'var(--color-error)' : 'var(--color-tertiary-container)',
                    color: 'white',
                    fontSize: '0.6rem'
                  }}>
                    {dispute.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700' }}>{dispute.flaggedBy}</span> in <span style={{ fontWeight: '600' }}>{dispute.group}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', color: 'var(--color-on-surface-variant)' }}>
                  <MessageSquare size={14} style={{ marginTop: '0.125rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>{dispute.reason}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                  <p className="text-label-sm" style={{ fontSize: '0.6rem' }}>Amount</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)' }}>Rs. {dispute.amount}</p>
                </div>
                <button className="btn-gradient" style={{ padding: '0.4rem' }}>Mediate</button>
                <button className="btn-secondary" style={{ padding: '0.4rem' }}>Ignore</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Disputes;
