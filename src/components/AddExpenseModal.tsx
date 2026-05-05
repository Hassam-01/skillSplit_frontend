import { Check, ChevronDown, Users, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { GroupMember, Profile } from '../types/database';
import { logAction } from '../utils/auditLog';
import { supabase } from '../utils/supabase';

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
  const [isTreatMode, setIsTreatMode] = useState(false);
  
  // Custom splitting states
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = parseFloat(amount) || 0;
  const members = groupMembers?.map(m => ({ id: m.user_id, name: (m.profiles as unknown as Profile | null)?.display_name ?? 'Unknown' })) ?? [];

  // Reset logic when opening or changing split type
  useEffect(() => {
    if (isOpen) {
      if (splitType === 'equal' || isTreatMode) {
        setTouchedIds(new Set());
      } else {
        // Initialize with equal split if not already set
        const participants = selectedParticipantIds;
        if (participants.length > 0) {
          if (splitType === 'exact') {
            const share = (totalAmount / participants.length).toFixed(2);
            const initial: Record<string, string> = {};
            participants.forEach(id => initial[id] = share);
            setExactAmounts(initial);
          } else if (splitType === 'percentage') {
            const share = (100 / participants.length).toFixed(2);
            const initial: Record<string, string> = {};
            participants.forEach(id => initial[id] = share);
            setPercentages(initial);
          }
        }
      }
    }
  }, [isOpen, splitType, totalAmount, selectedParticipantIds.length, isTreatMode]);

  // Auto-balancing logic
  useEffect(() => {
    if (splitType === 'equal' || isTreatMode) return;

    const participants = selectedParticipantIds;
    if (participants.length === 0) return;

    const untouched = participants.filter(id => !touchedIds.has(id));
    if (untouched.length === 0) return;

    if (splitType === 'exact') {
      const touchedSum = participants
        .filter(id => touchedIds.has(id))
        .reduce((sum, id) => sum + (parseFloat(exactAmounts[id]) || 0), 0);
      
      const remaining = totalAmount - touchedSum;
      const share = Math.max(0, remaining / untouched.length).toFixed(2);
      
      setExactAmounts(prev => {
        const next = { ...prev };
        untouched.forEach(id => next[id] = share);
        return next;
      });
    } else if (splitType === 'percentage') {
      const touchedSum = participants
        .filter(id => touchedIds.has(id))
        .reduce((sum, id) => sum + (parseFloat(percentages[id]) || 0), 0);
      
      const remaining = 100 - touchedSum;
      const share = Math.max(0, remaining / untouched.length).toFixed(2);
      
      setPercentages(prev => {
        const next = { ...prev };
        untouched.forEach(id => next[id] = share);
        return next;
      });
    }
  }, [touchedIds, totalAmount, splitType, selectedParticipantIds]);

  if (!isOpen) return null;
  if (!groupId || !groupMembers) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,29,14,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
        <div className="surface-lowest" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ marginBottom: '1.5rem' }}>Please open this from within a group to add an expense.</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const computeShares = (): Record<string, number> => {
    const shares: Record<string, number> = {};
    const participants = selectedParticipantIds;
    if (participants.length === 0) return shares;
    
    if (isTreatMode) {
      // In treat mode, the payer takes the full hit
      // Other selected participants get 0 share
      participants.forEach(id => {
        shares[id] = id === paidById ? totalAmount : 0;
      });
      // Ensure payer has a share even if not selected as a participant
      if (!participants.includes(paidById)) {
        shares[paidById] = totalAmount;
      }
    } else if (splitType === 'equal') {
      const share = totalAmount / participants.length;
      participants.forEach(id => { shares[id] = Math.round(share * 100) / 100; });
      const total = Object.values(shares).reduce((a, b) => a + b, 0);
      if (Math.abs(total - totalAmount) > 0.001) shares[participants[0]] += totalAmount - total;
    } else if (splitType === 'percentage') {
      participants.forEach(id => { shares[id] = Math.round((totalAmount * (parseFloat(percentages[id]) || 0) / 100) * 100) / 100; });
      const total = Object.values(shares).reduce((a, b) => a + b, 0);
      if (Math.abs(total - totalAmount) > 0.001) shares[participants[0]] += totalAmount - total;
    } else {
      participants.forEach(id => { shares[id] = parseFloat(exactAmounts[id]) || 0; });
    }
    return shares;
  };

  const currentSum = selectedParticipantIds.reduce((sum, id) => {
    if (isTreatMode) return totalAmount;
    if (splitType === 'percentage') return sum + (parseFloat(percentages[id]) || 0);
    if (splitType === 'exact') return sum + (parseFloat(exactAmounts[id]) || 0);
    return totalAmount;
  }, 0);

  const isInvalid = splitType === 'percentage' 
    ? Math.abs(currentSum - 100) > 0.01 
    : splitType === 'exact' 
      ? Math.abs(currentSum - totalAmount) > 0.01 
      : totalAmount <= 0;

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Reset touched if someone is removed
      if (prev.includes(id)) {
        setTouchedIds(t => {
          const n = new Set(t);
          n.delete(id);
          return n;
        });
      }
      return next;
    });
  };

  const handleCustomInputChange = (id: string, value: string) => {
    setTouchedIds(prev => new Set(prev).add(id));
    if (splitType === 'percentage') {
      setPercentages(prev => ({ ...prev, [id]: value }));
    } else {
      setExactAmounts(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId) return;
    if (selectedParticipantIds.length === 0) { setError('Select at least one participant.'); return; }
    if (isInvalid) { 
      setError(splitType === 'percentage' ? 'Percentages must total 100%' : 'Exact amounts must total the total amount'); 
      return; 
    }
    setLoading(true);
    setError(null);
    try {
      const shares = computeShares();
      const { data: expense, error: eErr } = await supabase.from('expenses').insert({
        group_id: groupId, description: description.trim(), amount: totalAmount, currency: 'PKR',
        paid_by: paidById, split_type: isTreatMode ? 'treat' : splitType, category, notes: notes.trim() || null, 
        created_by: user.id, is_treat: isTreatMode,
      }).select().single();
      if (eErr) throw eErr;

      const allParticipantIds = Array.from(new Set([...selectedParticipantIds, paidById]));
      const participantRows = allParticipantIds.map(uid => ({
        expense_id: expense.id, user_id: uid, share_amount: shares[uid] ?? 0, is_payer: uid === paidById,
      }));
      const { error: pErr } = await supabase.from('expense_participants').insert(participantRows);
      if (pErr) throw pErr;

      const payerName = profile?.display_name ?? 'Someone';
      const notifRows = selectedParticipantIds
        .filter(id => id !== user.id)
        .map(uid => ({
          user_id: uid, type: 'expense_added', title: isTreatMode ? `Treat from ${payerName}` : `New expense: ${description}`,
          body: isTreatMode 
            ? `${payerName} treated everyone to "${description}"! Your share is Rs. 0.`
            : `${payerName} added Rs. ${totalAmount.toLocaleString()} expense. Your share: Rs. ${(shares[uid] ?? 0).toLocaleString()}`,
          related_id: expense.id,
        }));
      if (notifRows.length > 0) await supabase.from('notifications').insert(notifRows);

      await logAction({ groupId, actorId: user.id, action: 'expense_added', targetId: expense.id, targetType: 'expense', newValue: { description, amount: totalAmount } });

      setDescription(''); setAmount(''); setCategory('other'); setSplitType('equal'); setNotes(''); setIsTreatMode(false);
      setSelectedParticipantIds(user ? [user.id] : []); setExactAmounts({}); setPercentages({}); setTouchedIds(new Set());
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-container-low)', border: '1px solid transparent', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27, 29, 14, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflowY: 'auto', padding: '1rem' }}>
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

          {/* Treat Mode Toggle */}
          <div 
            onClick={() => setIsTreatMode(!isTreatMode)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '0.875rem 1.25rem', 
              backgroundColor: isTreatMode ? 'var(--color-success-container)' : 'var(--color-surface-container-low)', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              border: isTreatMode ? '1px solid var(--color-success)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                backgroundColor: isTreatMode ? 'var(--color-success)' : 'var(--color-surface-container-high)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isTreatMode ? 'white' : 'var(--color-on-surface-variant)',
                transition: 'all 0.2s'
              }}>
                <Zap size={18} fill={isTreatMode ? 'currentColor' : 'none'} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: isTreatMode ? 'var(--color-success)' : 'var(--color-on-surface)' }}>Treat Mode</p>
                <p style={{ fontSize: '0.7rem', color: isTreatMode ? 'var(--color-success)' : 'var(--color-on-surface-variant)', opacity: 0.8 }}>"It's on me" — others owe PKR 0</p>
              </div>
            </div>
            <div style={{ 
              width: '40px', 
              height: '22px', 
              borderRadius: '100px', 
              backgroundColor: isTreatMode ? 'var(--color-success)' : 'var(--color-outline-variant)', 
              position: 'relative', 
              transition: 'all 0.2s' 
            }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                borderRadius: '50%', 
                backgroundColor: 'white', 
                position: 'absolute', 
                top: '3px', 
                left: isTreatMode ? '21px' : '3px', 
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }} />
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
              <select 
                value={splitType} 
                onChange={e => setSplitType(e.target.value)} 
                disabled={isTreatMode}
                style={{ ...inputStyle, appearance: 'none', cursor: isTreatMode ? 'not-allowed' : 'pointer', opacity: isTreatMode ? 0.6 : 1 }}
              >
                {isTreatMode ? <option value="treat">Treat (Payer takes all)</option> : SPLIT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.75rem' }}>
              <Users size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Split With
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {members.map(m => {
                const isSelected = selectedParticipantIds.includes(m.id);
                const isPayer = m.id === paidById;
                return (
                  <div 
                    key={m.id} 
                    onClick={() => !isTreatMode && toggleParticipant(m.id)} 
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '100px', 
                      backgroundColor: isSelected ? (isTreatMode && !isPayer ? 'var(--color-surface-container-high)' : 'var(--color-primary)') : 'var(--color-surface-container-highest)', 
                      color: isSelected ? (isTreatMode && !isPayer ? 'var(--color-on-surface-variant)' : 'var(--color-on-primary)') : 'var(--color-on-surface)', 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      cursor: isTreatMode ? 'default' : 'pointer', 
                      transition: 'all 0.15s',
                      opacity: isTreatMode && !isSelected && !isPayer ? 0.5 : 1,
                      border: isTreatMode && isSelected && !isPayer ? '1px dashed var(--color-outline-variant)' : '1px solid transparent'
                    }}
                  >
                    {m.id === user?.id ? 'You' : m.name}
                    {isTreatMode && isSelected && !isPayer && <span style={{ fontSize: '0.65rem', marginLeft: '0.4rem', opacity: 0.7 }}>(Owes 0)</span>}
                  </div>
                );
              })}
            </div>

            {splitType !== 'equal' && !isTreatMode && selectedParticipantIds.length > 0 && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
                {selectedParticipantIds.map(id => {
                  const name = members.find(m => m.id === id)?.name ?? 'Unknown';
                  const isTouched = touchedIds.has(id);
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{id === user?.id ? 'You' : name}</span>
                        {isTouched && <Check size={12} color="var(--color-success)" />}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder={splitType === 'percentage' ? '0' : '0.00'} 
                          value={splitType === 'percentage' ? (percentages[id] ?? '') : (exactAmounts[id] ?? '')}
                          onChange={e => handleCustomInputChange(id, e.target.value)}
                          style={{ ...inputStyle, width: '100px', padding: '0.4rem 0.6rem', border: isTouched ? '1px solid var(--color-primary)' : '1px solid transparent' }} 
                        />
                        <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', pointerEvents: 'none' }}>
                          {splitType === 'percentage' ? '%' : 'Rs'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Total Split:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isInvalid ? 'var(--color-error)' : 'var(--color-success)' }}>
                    {splitType === 'percentage' ? `${currentSum.toFixed(1)}%` : `Rs. ${currentSum.toLocaleString()}`}
                    {isInvalid && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem' }}>({splitType === 'percentage' ? 'needs 100%' : `needs Rs. ${totalAmount.toLocaleString()}`})</span>}
                  </span>
                </div>
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
            <button type="submit" className="btn-gradient" style={{ flex: 2 }} disabled={loading || isInvalid}>{loading ? 'Saving…' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
