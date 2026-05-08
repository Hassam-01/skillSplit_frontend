import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, Clock, Zap } from 'lucide-react';
import type { GroupDetailData, MemberBalance } from '../hooks/useGroupDetail';


interface GroupRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: GroupDetailData;
  user: { id: string } | null;
}

const GroupRightSidebar: React.FC<GroupRightSidebarProps> = ({
  isOpen,
  onClose,
  data,
  user,
}) => {
  if (!data) return null;

  const activeBalances = data.memberBalances.filter((mb: MemberBalance) => Math.abs(mb.netBalance) > 0.01);

  return (
    <>
      {/* Overlay for mobile/med */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 998,
            transition: 'opacity 0.3s ease'
          }} 
          className="lg-hide"
        />
      )}

      <aside className={`right-sidebar-drawer right-sidebar-desktop ${isOpen ? 'open' : ''}`}>
        {/* Add sticky positioning for desktop layout */}
        <style>{`@media (min-width: 1025px) { .right-sidebar-desktop { position: sticky; top: 1rem; align-self: start; } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="lg-hide">
          <h3 className="text-title-lg">Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
             <ChevronUp style={{ transform: 'rotate(90deg)' }} size={24} />
          </button>
        </div>

        {/* Balances Section */}
        <div className="surface-high" style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '1.25rem' }}>
          <h3 className="text-title-lg" style={{ marginBottom: '1rem' }}>Balances</h3>
          {activeBalances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem 1rem', backgroundColor: 'var(--color-success-container)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>✨ You're all settled up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeBalances.map((mb: MemberBalance) => {
                  const isOwed = mb.netBalance > 0.01;
                  const isOwer = mb.netBalance < -0.01;
                  const statusColor = isOwed ? 'var(--color-success)' : isOwer ? 'var(--color-error)' : 'var(--color-on-surface-variant)';
                  const bgColor = isOwed ? 'var(--color-success-container)' : isOwer ? 'var(--color-error-container)' : 'var(--color-surface-container-lowest)';
                  const hasPending = data.pendingSettlements.some((s: { payer_id: string; payee_id: string }) => s.payer_id === user?.id && s.payee_id === mb.userId);

                  return (
                    <div key={mb.userId} style={{ 
                      padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: bgColor,
                      border: `1px solid ${isOwed ? 'var(--color-success-container)' : isOwer ? 'var(--color-error-container)' : 'var(--color-outline-variant)'}`,
                      display: 'flex', alignItems: 'center', gap: '0.875rem'
                    }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        backgroundColor: isOwed ? 'var(--color-success-container)' : isOwer ? 'var(--color-error-container)' : 'var(--color-surface-container-high)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '700', color: statusColor, flexShrink: 0
                      }}>
                        {mb.displayName[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--color-on-surface)', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mb.displayName}
                        </p>
                        <p style={{ fontSize: '0.8rem', fontWeight: '500', color: statusColor, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isOwed ? 'Owes you' : isOwer ? 'You owe' : 'Settled'}
                          <span style={{ fontWeight: '700' }}>Rs. {Math.abs(mb.netBalance).toLocaleString()}</span>
                        </p>
                        {hasPending && <div className="pending-badge"><Clock size={10} /> Pending Approval</div>}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>
      </aside>
    </>
  );
};

export default GroupRightSidebar;
