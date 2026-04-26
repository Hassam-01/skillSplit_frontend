import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Plus } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const stats = [
    { label: 'Total Balance', value: '14,500', color: 'var(--color-primary)' },
    { label: 'You are owed', value: '32,450', color: '#1b5e20', icon: <ArrowUpRight size={20} /> },
    { label: 'You owe', value: '17,950', color: '#b71c1c', icon: <ArrowDownLeft size={20} /> },
  ];

  const recentExpenses = [
    { id: 1, title: 'Dinner at Kolachi', group: 'Lahore Trip', amount: '8,500', date: 'Today', payer: 'You' },
    { id: 2, title: 'Petrol', group: 'Roommates', amount: '2,000', date: 'Yesterday', payer: 'Ali' },
    { id: 3, title: 'Netflix Subscription', group: 'Friends', amount: '1,500', date: 'Oct 18', payer: 'You' },
  ];

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="text-headline-lg">Dashboard</h2>
          <p className="text-body-lg">Your financial footprint across all endeavors.</p>
        </div>
        <button 
          className="btn-gradient" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          Add Expense
        </button>
      </header>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="surface-lowest" style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.5rem' }}>
              {stat.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: stat.color }}>Rs. {stat.value}</h3>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            {stat.label === 'You are owed' && (
              <p className="text-label-sm" style={{ marginTop: '0.5rem', color: 'var(--color-on-surface-variant)' }}>
                Across 4 groups
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid-asymmetric" style={{ gap: '2rem' }}>
        <div className="surface-low" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="text-title-lg">Recent Activity</h3>
            <button style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontWeight: '600',
              cursor: 'pointer' 
            }}>
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recentExpenses.map((expense) => (
              <div key={expense.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--color-surface-container-highest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    🍽️
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>{expense.title}</p>
                    <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {expense.group} • {expense.date}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '700', fontSize: '1.125rem', color: expense.payer === 'You' ? '#1b5e20' : 'var(--color-on-surface)' }}>
                    {expense.payer === 'You' ? '+' : '-'} Rs. {expense.amount}
                  </p>
                  <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Paid by {expense.payer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-high" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', height: 'fit-content' }}>
          <h3 className="text-title-lg" style={{ marginBottom: '1.5rem' }}>Quick Summary</h3>
          <p style={{ marginBottom: '2rem', color: 'var(--color-on-surface-variant)' }}>
            You have 3 pending settlements to confirm and 1 dispute waiting for mediation.
          </p>
          <button className="btn-secondary" style={{ width: '100%', marginBottom: '1rem' }}>
            Optimize Debts
          </button>
          <button style={{ 
            width: '100%', 
            padding: '1rem', 
            background: 'none', 
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Review Disputes
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
