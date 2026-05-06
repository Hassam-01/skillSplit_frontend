import React, { useState } from 'react';
import { X, Users, ChevronDown } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/auditLog';
import type { GroupMember, Profile } from '../types/database';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  groupId?: string;
  groupMembers?: GroupMember[];
}

const CATEGORIES = ['dining', 'food', 'transport', 'travel', 'entertainment', 'shopping', 'utilities', 'health', 'sightseeing', 'other'];
const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal Split' },
  { value: 'percentage', label: 'By Percentage' },
  { value: 'exact', label: 'Exact Amounts' },
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSaved, groupId, groupMembers }) => {
  const { user, profile } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [splitType, setSplitType] = useState('equal');
  const [notes, setNotes] = useState('');
  const [paidById, setPaidById] = useState(user?.id ?? '');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(user ? [user.id] : []);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  if (!groupId || !groupMembers) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,29,14,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div className="surface-lowest" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ marginBottom: '1.5rem' }}>Please open this from within a group to add an expense.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const members = groupMembers.map(m => ({ id: m.user_id, name: (m.profiles as unknown as Profile | null)?.display_name ?? 'Unknown' }));
  const totalAmount = parseFloat(amount) || 0;

  const computeShares = (): Record<string, number> => {
    const shares: Record<string, number> = {};
    const participants = selectedParticipantIds;
    if (participants.length === 0) return shares;
    if (splitType === 'equal') {
      const share = totalAmount / participants.length;
      participants.forEach(id => { shares[id] = Math.round(share * 100) / 100; });
      // Fix rounding on first participant
      const total = Object.values(shares).reduce((a, b) => a + b, 0);
      if (Math.abs(total - totalAmount) > 0.001 && participants.length > 0) {
        shares[participants[0]] += totalAmount - total;
      }
    } else if (splitType === 'percentage') {
      participants.forEach(id => { shares[id] = totalAmount * ((parseFloat(percentages[id]) || 0) / 100); });
    } else {
      participants.forEach(id => { shares[id] = parseFloat(exactAmounts[id]) || 0; });
    }
    return shares;
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId) return;
    if (selectedParticipantIds.length === 0) { setError('Select at least one participant.'); return; }
    setLoading(true);
    setError(null);
    try {
      const shares = computeShares();
      const { data: expense, error: eErr } = await supabase.from('expenses').insert({
        group_id: groupId, description: description.trim(), amount: totalAmount, currency: 'PKR',
        paid_by: paidById, split_type: splitType, category, notes: notes.trim() || null, created_by: user.id,
      }).select().single();
      if (eErr) throw eErr;

      const participantRows = selectedParticipantIds.map(uid => ({
        expense_id: expense.id, user_id: uid, share_amount: shares[uid] ?? 0, is_payer: uid === paidById,
      }));
      const { error: pErr } = await supabase.from('expense_participants').insert(participantRows);
      if (pErr) throw pErr;

      // Create notifications for all participants except payer
      const payerName = profile?.display_name ?? 'Someone';
      const notifRows = selectedParticipantIds
        .filter(id => id !== user.id)
        .map(uid => ({
          user_id: uid, type: 'expense_added', title: `New expense: ${description}`,
          body: `${payerName} added Rs. ${totalAmount.toLocaleString()} expense. Your share: Rs. ${(shares[uid] ?? 0).toLocaleString()}`,
          related_id: expense.id,
        }));
      if (notifRows.length > 0) await supabase.from('notifications').insert(notifRows);

      await logAction({ groupId, actorId: user.id, action: 'expense_added', targetId: expense.id, targetType: 'expense', newValue: { description, amount: totalAmount } });

      setDescription(''); setAmount(''); setCategory('other'); setSplitType('equal'); setNotes('');
      setSelectedParticipantIds(user ? [user.id] : []); setExactAmounts({}); setPercentages({});
      onSaved();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-container-low)', border: '1px solid transparent', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27, 29, 14, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '1rem' }}>
      <div className="surface-lowest" style={{ width: '100%', maxWidth: '520px', borderRadius: 'var(--radius-xl)', padding: '1.75rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', margin: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}><X size={22} /></button>
        <h2 className="text-headline-lg" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Add Expense</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Description *</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was it for?" required style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (Rs.) *</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required style={inputStyle} />
            </div>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
              <div style={{ position: 'relative' }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-on-surface-variant)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Paid By</label>
              <select value={paidById} onChange={e => setPaidById(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                {members.map(m => <option key={m.id} value={m.id}>{m.id === user?.id ? 'You' : m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Split Type</label>
              <select value={splitType} onChange={e => setSplitType(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                {SPLIT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.75rem' }}>
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Split With
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {members.map(m => {
                const isSelected = selectedParticipantIds.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleParticipant(m.id)} style={{ padding: '0.5rem 1rem', borderRadius: '100px', backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-container-highest)', color: isSelected ? 'white' : 'var(--color-on-surface)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {m.id === user?.id ? 'You' : m.name}
                  </div>
                );
              })}
            </div>
            {/* Exact amount / percentage inputs */}
            {splitType !== 'equal' && selectedParticipantIds.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedParticipantIds.map(id => {
                  const name = members.find(m => m.id === id)?.name ?? 'Unknown';
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem', minWidth: '80px' }}>{id === user?.id ? 'You' : name}</span>
                      <input type="number" min="0" step="0.01" placeholder={splitType === 'percentage' ? '%' : 'Rs.'} value={splitType === 'percentage' ? (percentages[id] ?? '') : (exactAmounts[id] ?? '')}
                        onChange={e => splitType === 'percentage' ? setPercentages(p => ({ ...p, [id]: e.target.value })) : setExactAmounts(p => ({ ...p, [id]: e.target.value }))}
                        style={{ ...inputStyle, width: '120px', padding: '0.5rem 0.75rem' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>{splitType === 'percentage' ? '%' : 'PKR'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details…" rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(186,26,26,0.05)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-gradient" style={{ flex: 2 }} disabled={loading}>{loading ? 'Saving…' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
