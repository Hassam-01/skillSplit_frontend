import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { EventPool, Profile } from '../types/database';
import { Coins, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PoolsListProps {
  groupId: string;
}

const PoolsList: React.FC<PoolsListProps> = ({ groupId }) => {
  const { user } = useAuth();
  const [pools, setPools] = useState<EventPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [contributingTo, setContributingTo] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const fetchPools = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('event_pools')
      .select('*, contributions(*, profiles(*))')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setPools(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPools();
  }, [groupId]);

  const handleContribute = async (poolId: string) => {
    if (!user || !amount) return;
    try {
      const { error } = await supabase.from('pool_contributions').insert({
        pool_id: poolId,
        user_id: user.id,
        amount: parseFloat(amount),
      });
      if (error) throw error;
      setAmount('');
      setContributingTo(null);
      fetchPools();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-on-surface-variant)' }}>Loading pools…</div>;

  if (pools.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {pools.map(pool => {
        const totalContributed = pool.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        const progress = pool.target_amount ? (totalContributed / pool.target_amount) * 100 : 0;
        
        return (
          <div key={pool.id} className="surface-lowest" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{pool.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                  {pool.target_amount ? `Target: Rs. ${pool.target_amount.toLocaleString()}` : 'No target amount'}
                  {pool.per_member ? ` • Rs. ${pool.per_member.toLocaleString()} per member` : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)' }}>Rs. {totalContributed.toLocaleString()}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>Collected</p>
              </div>
            </div>

            {pool.target_amount && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, progress)}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-on-surface-variant)', textAlign: 'right' }}>
                  {Math.round(progress)}% of target reached
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pool.contributions?.map(c => {
                const p = c.profiles as unknown as Profile;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                        <User size={12} />
                      </div>
                      <span>{p?.display_name || 'Anonymous'}</span>
                    </div>
                    <span style={{ fontWeight: '600' }}>Rs. {c.amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {contributingTo === pool.id ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', outline: 'none' }}
                  />
                  <button className="btn-gradient" onClick={() => handleContribute(pool.id)} style={{ padding: '0.5rem 1rem' }}>Pitch In</button>
                  <button className="btn-secondary" onClick={() => setContributingTo(null)} style={{ padding: '0.5rem' }}><X size={16} /></button>
                </div>
              ) : (
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                  onClick={() => {
                    setContributingTo(pool.id);
                    if (pool.per_member) setAmount(pool.per_member.toString());
                  }}
                >
                  <Coins size={16} /> Pitch in money
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PoolsList;
