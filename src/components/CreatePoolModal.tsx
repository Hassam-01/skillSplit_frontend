import React, { useState } from 'react';
import { X, Target } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/auditLog';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  groupId: string;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({ isOpen, onClose, onCreated, groupId }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [perMember, setPerMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: pool, error: pErr } = await supabase
        .from('event_pools')
        .insert({
          group_id: groupId,
          name: name.trim(),
          target_amount: targetAmount ? parseFloat(targetAmount) : null,
          per_member: perMember ? parseFloat(perMember) : null,
          created_by: user.id,
          status: 'active'
        })
        .select()
        .single();
      if (pErr) throw pErr;

      await logAction({ 
        groupId, 
        actorId: user.id, 
        action: 'pool_created', 
        targetId: pool.id, 
        targetType: 'pool', 
        newValue: { name: pool.name, target: pool.target_amount } 
      });

      setName(''); setTargetAmount(''); setPerMember('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-surface-container-low)',
    border: '1px solid transparent', borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,29,14,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="surface-lowest" style={{ width: '100%', maxWidth: '440px', borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Target size={20} />
          </div>
          <h2 className="text-headline-lg" style={{ fontSize: '1.25rem' }}>Create Central Pool</h2>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="poolName" className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Pool Name *</label>
            <input id="poolName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Birthday Cake Fund" required style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="targetTotal" className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Total (Optional)</label>
              <input id="targetTotal" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="perPerson" className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Per Person (Optional)</label>
              <input id="perPerson" type="number" value={perMember} onChange={e => setPerMember(e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', fontStyle: 'italic' }}>
            A central pool allows group members to pitch in money for a specific goal or event.
          </p>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-gradient" style={{ flex: 2, backgroundColor: 'var(--color-tertiary)' }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoolModal;
