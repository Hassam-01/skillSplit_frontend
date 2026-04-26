import React from 'react';
import { Users, UserPlus, ShieldCheck, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Groups = () => {
  const groups = [
    { id: 'lahore-trip', name: 'Lahore Trip', members: 4, balance: '+4,625', status: 'You are owed' },
    { id: 'roommates', name: 'Roommates', members: 3, balance: '-2,000', status: 'You owe' },
    { id: 'office-lunch', name: 'Office Lunch', members: 8, balance: '0', status: 'Settled' },
  ];

  return (
    <div>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-headline-lg">Form an Alliance</h2>
          <p className="text-body-lg">Establish a new shared ledger or integrate into an existing cooperative framework.</p>
        </div>
        <button className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Create Group
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
        <section>
          <h3 className="text-title-lg" style={{ marginBottom: '2rem' }}>Your Alliances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="surface-lowest" style={{ 
                  padding: '1.5rem 2.5rem', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '16px', 
                      backgroundColor: 'var(--color-surface-container-low)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)'
                    }}>
                      <Users size={28} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{group.name}</h4>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{group.members} Members</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{group.status}</p>
                      <p style={{ 
                        fontWeight: '700', 
                        fontSize: '1.25rem', 
                        color: group.balance.startsWith('+') ? '#1b5e20' : group.balance.startsWith('-') ? '#b71c1c' : 'var(--color-on-surface)' 
                      }}>
                        Rs. {group.balance.replace('+', '').replace('-', '')}
                      </p>
                    </div>
                    <ChevronRight size={24} style={{ color: 'var(--color-outline-variant)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside>
          <div className="surface-high" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <UserPlus size={24} color="var(--color-primary)" />
              <h3 className="text-title-lg" style={{ fontSize: '1.25rem' }}>Join with Code</h3>
            </div>
            <p className="text-body-lg" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Enter a provided access key to integrate into an existing ledger.
            </p>
            <input 
              type="text" 
              placeholder="E.g. SKL-928-X"
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '1rem',
                textAlign: 'center',
                letterSpacing: '0.1em',
                fontWeight: '600'
              }}
            />
            <button className="btn-secondary" style={{ width: '100%' }}>Join Alliance</button>
            <p className="text-label-sm" style={{ marginTop: '1rem', color: 'var(--color-on-surface-variant)', fontSize: '0.7rem', textAlign: 'center' }}>
              Codes are case-sensitive and typically 9 characters long.
            </p>
          </div>

          <div className="surface-low" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <h3 className="text-title-lg" style={{ fontSize: '1.25rem' }}>Verified Groups</h3>
            </div>
            <p className="text-body-lg" style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
              All groups on SkillSplit use end-to-end reconciliation to ensure every paisa is accounted for.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Groups;
