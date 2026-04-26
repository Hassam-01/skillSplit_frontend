import React from 'react';
import { Calendar, User, MoreVertical, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GroupDetail = () => {
  const groupInfo = {
    name: 'Lahore Trip',
    members: 4,
    created: 'Mar 12, 2024',
    totalSpending: '28,500'
  };

  const expenses = [
    { id: 1, title: 'Haveli Restaurant Dinner', date: 'Apr 15', addedBy: 'Ali', total: '18,500', share: '4,625', category: 'Dining' },
    { id: 2, title: 'Rent-a-Car Fuel', date: 'Apr 14', addedBy: 'Zain', total: '8,000', share: '2,000', category: 'Transport' },
    { id: 3, title: 'Lahore Fort Tickets', date: 'Apr 14', addedBy: 'You', total: '2,000', share: '500', category: 'Sightseeing' },
  ];

  return (
    <div>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-on-surface-variant)', textDecoration: 'none', marginBottom: '2rem', fontWeight: '600' }}>
        <ArrowLeft size={20} />
        Back to Dashboard
      </Link>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '6px', 
              backgroundColor: 'var(--color-tertiary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-on-tertiary-container)'
            }}>
              <Plus size={12} />
            </div>
            <h2 className="text-headline-lg">{groupInfo.name}</h2>
          </div>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
            {groupInfo.members} Members • Created {groupInfo.created}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.125rem' }}>Total Group Spending</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Rs. {groupInfo.totalSpending}</h3>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="text-title-lg">Expenses</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ padding: '0.5rem 1.5rem' }}>Filter</button>
              <button className="btn-gradient" style={{ padding: '0.5rem 1.5rem' }}>Add New</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {expenses.map((expense) => (
              <div key={expense.id} className="surface-lowest" style={{ 
                padding: '1.5rem 2rem', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    backgroundColor: 'var(--color-surface-container-low)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {expense.category === 'Dining' ? '🥘' : expense.category === 'Transport' ? '🚗' : '🏛️'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{expense.title}</h4>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> {expense.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={14} /> Added by {expense.addedBy}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Total</p>
                    <p style={{ fontWeight: '700', fontSize: '1.125rem' }}>Rs. {expense.total}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Your Share</p>
                    <p style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--color-primary)' }}>Rs. {expense.share}</p>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: 'var(--color-outline-variant)', cursor: 'pointer' }}>
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <div className="surface-high" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1.5rem' }}>Balances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { name: 'Ali Khan', status: 'owes you', amount: '4,625', color: '#1b5e20' },
                { name: 'Zain Malik', status: 'you owe', amount: '2,000', color: '#b71c1c' },
                { name: 'Sana Ahmed', status: 'owes you', amount: '500', color: '#1b5e20' },
              ].map((member, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '600' }}>{member.name}</p>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{member.status}</p>
                  </div>
                  <p style={{ fontWeight: '700', color: member.color }}>Rs. {member.amount}</p>
                </div>
              ))}
            </div>
            <button className="btn-gradient" style={{ width: '100%', marginTop: '2rem' }}>Settle Up</button>
          </div>

          <div className="surface-low" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
            <h3 className="text-title-lg" style={{ marginBottom: '1rem' }}>Group Settings</h3>
            <p className="text-body-lg" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Manage members, export history, or simplify debts for this group.
            </p>
            <button style={{ 
              width: '100%', 
              padding: '0.75rem', 
              background: 'white', 
              border: '1px solid var(--color-outline-variant)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Export CSV
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GroupDetail;
