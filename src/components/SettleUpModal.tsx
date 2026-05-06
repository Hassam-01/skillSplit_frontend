import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/auditLog';
import type { MemberBalance } from '../hooks/useGroupDetail';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
  groupId: string;
  memberBalances: MemberBalance[];
}

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash', 'Raast'];

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, onSettled, groupId, memberBalances }) => {
  const { user } = useAuth();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Only show members you owe (negative balance)
  const membersYouOwe = memberBalances.filter(m => m.netBalance < -0.01);
  const selected = memberBalances.find(m => m.userId === selectedMemberId);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMemberId || !amount) return;
    setLoading(true);
    setError(null);
    try {
      const { error: sErr } = await supabase.from('settlements').insert({
        group_id: groupId,
        payer_id: user.id,
        payee_id: selectedMemberId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        status: 'pending',
      });
      if (sErr) throw sErr;

      // Create notification for payee
      const { data: userData } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
      const payerName = userData?.display_name ?? 'Someone';
      
      await supabase.from('notifications').insert({
        user_id: selectedMemberId,
        type: 'settlement_pending',
        title: 'Settlement marked',
        body: `${payerName} marked Rs. ${parseFloat(amount).toLocaleString()} as paid. Please verify.`,
        related_id: groupId,
      });

      await logAction({ groupId, actorId: user.id, action: 'settlement_created', targetId: selectedMemberId, targetType: 'profile', newValue: { amount: parseFloat(amount) } });

      setSelectedMemberId(''); setAmount(''); setNotes('');
      onSettled();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
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
      <div className="surface-lowest" style={{ width: '100%', maxWidth: '420px', borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
          <X size={22} />
        </button>

        <h2 className="text-headline-lg" style={{ fontSize: '1.25rem', marginBottom: '1.75rem' }}>Settle Up</h2>

        {membersYouOwe.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎉</p>
            <p style={{ fontWeight: '600' }}>You don't owe anyone in this group!</p>
          </div>
        ) : (
          <form onSubmit={handleSettle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Pay To</label>
              <select value={selectedMemberId} onChange={e => { setSelectedMemberId(e.target.value); const m = membersYouOwe.find(x => x.userId === e.target.value); if (m) setAmount(Math.abs(m.netBalance).toFixed(2)); }} style={{ ...inputStyle, cursor: 'pointer' }} required>
                <option value="">Select member…</option>
                {membersYouOwe.map(m => <option key={m.userId} value={m.userId}>{m.displayName} — Rs. {Math.abs(m.netBalance).toLocaleString()}</option>)}
              </select>
            </div>

            {selected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: '700' }}>You</span>
                <ArrowRight size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: '700' }}>{selected.displayName}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--color-error)', fontWeight: '700' }}>Rs. {Math.abs(selected.netBalance).toLocaleString()}</span>
              </div>
            )}

            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (PKR)</label>
              <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required style={inputStyle} />
            </div>

            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Notes (optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note…" style={inputStyle} />
            </div>

            {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-gradient" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Processing…' : 'Confirm Settlement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettleUpModal;
