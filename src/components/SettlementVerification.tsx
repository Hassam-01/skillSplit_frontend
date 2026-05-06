import React, { useState } from 'react';
import { CheckCircle2, XCircle, Smartphone } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Settlement {
  id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  profiles: {
    display_name: string;
  } | null;
  group_id: string;
}

interface SettlementVerificationProps {
  settlements: Settlement[];
  onAction: () => void;
}

const SettlementVerification: React.FC<SettlementVerificationProps> = ({ settlements, onAction }) => {
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Only show settlements where the current user is the payee
  const myPending = settlements.filter(s => s.payee_id === user?.id);

  if (myPending.length === 0) return null;

  const handleAction = async (id: string, status: 'confirmed' | 'rejected') => {
    setLoadingId(id);
    try {
      const updateData: { status: string; confirmed_at?: string } = { status };
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('settlements')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Create notification for payer
      const settlement = myPending.find(x => x.id === id);
      if (settlement && user) {
        const { data: userData } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
        const payeeName = userData?.display_name ?? 'Someone';
        
        await supabase.from('notifications').insert({
          user_id: settlement.payer_id,
          type: status === 'confirmed' ? 'settlement_verified' : 'settlement_rejected',
          title: status === 'confirmed' ? 'Payment Verified' : 'Payment Rejected',
          body: status === 'confirmed' 
            ? `${payeeName} confirmed your Rs. ${Number(settlement.amount).toLocaleString()} payment.` 
            : `${payeeName} rejected your Rs. ${Number(settlement.amount).toLocaleString()} payment claim.`,
          related_id: settlement.group_id,
        });
      }

      onAction();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="settlement-verification-container">
      {myPending.map(s => (
        <div key={s.id} className="verification-card">
          <div className="verification-info">
            <div className="verification-icon">
              <Smartphone size={20} />
            </div>
            <div className="verification-text">
              <p className="verification-title">
                <strong>{s.profiles?.display_name}</strong> claims to have paid you
              </p>
              <p className="verification-amount">Rs. {Number(s.amount).toLocaleString()}</p>
              <div className="verification-meta">
                <span className="badge-method">{s.payment_method}</span>
                {s.notes && <span className="verification-note">"{s.notes}"</span>}
              </div>
            </div>
          </div>
          
          <div className="verification-actions">
            <button 
              className="btn-verify" 
              onClick={() => handleAction(s.id, 'confirmed')}
              disabled={!!loadingId}
            >
              <CheckCircle2 size={16} /> {loadingId === s.id ? '...' : 'Verify'}
            </button>
            <button 
              className="btn-reject" 
              onClick={() => handleAction(s.id, 'rejected')}
              disabled={!!loadingId}
            >
              <XCircle size={16} /> {loadingId === s.id ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettlementVerification;
