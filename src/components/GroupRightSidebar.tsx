import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, LogOut, Trash2, Copy, Check, ChevronUp, Clock, Zap } from 'lucide-react';
import type { Profile } from '../types/database';
import type { GroupDetailData, MemberBalance } from '../hooks/useGroupDetail';


interface GroupRightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: GroupDetailData;
  user: { id: string } | null;
  isAdmin: boolean;
  isUserInvolved: (userId: string) => boolean;
  onSettleUp: () => void;
  onAddMember: () => void;
  onRemoveMember: (member: { id: string; user_id: string; displayName: string }) => void;
  copyInviteToken: () => void;
  copied: boolean;
}

const GroupRightSidebar: React.FC<GroupRightSidebarProps> = ({
  isOpen,
  onClose,
  data,
  user,
  isAdmin,
  isUserInvolved,
  onSettleUp,
  onAddMember,
  onRemoveMember,
  copyInviteToken,
  copied
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="lg-hide">
          <h3 className="text-title-lg">Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
             <ChevronUp style={{ transform: 'rotate(90deg)' }} size={24} />
          </button>
        </div>

        {/* Balances Section */}
        <div className="surface-high" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
          <h3 className="text-title-lg" style={{ marginBottom: '1.5rem' }}>Balances</h3>
          {activeBalances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: 'var(--color-success-container)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
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
                      padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: bgColor,
                      border: `1px solid ${isOwed ? 'var(--color-success-container)' : isOwer ? 'var(--color-error-container)' : 'var(--color-outline-variant)'}`,
                      display: 'flex', alignItems: 'center', gap: '0.875rem'
                    }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', 
                        backgroundColor: isOwed ? 'var(--color-success-container)' : isOwer ? 'var(--color-error-container)' : 'var(--color-surface-container-high)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700', color: statusColor, flexShrink: 0
                      }}>
                        {mb.displayName[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-on-surface)', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mb.displayName}
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: '500', color: statusColor, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            <button className="btn-gradient" style={{ width: '100%' }} onClick={onSettleUp}>
              Settle Up
            </button>
            {activeBalances.length > 1 && (
              <Link 
                to={`/optimize?groupId=${data.id}`} 
                style={{ 
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--color-surface-container-lowest)', 
                  color: 'var(--color-primary)', 
                  fontWeight: '700', 
                  fontSize: '0.9rem', 
                  border: '2px solid var(--color-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Zap size={16} /> Smart Optimize
              </Link>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="surface-low" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="text-title-lg">Members</h3>
            <button onClick={onAddMember} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: '600' }}>
              <UserPlus size={16} /> Add
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {data.members.map((m) => {
              const profile = m.profiles as unknown as Profile | null;
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                      {(profile?.display_name ?? '?')[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{profile?.display_name ?? 'Unknown'}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-on-surface-variant)' }}>{m.role}</p>
                    </div>
                  </div>
                  {(m.user_id === user?.id ? (m.role !== 'admin' && !isUserInvolved(m.user_id)) : (isAdmin && !isUserInvolved(m.user_id))) && (
                    <button 
                      onClick={() => onRemoveMember({ id: m.id, user_id: m.user_id, displayName: profile?.display_name ?? 'Unknown' })}
                      style={{ background: 'none', border: 'none', padding: '0.4rem', cursor: 'pointer', color: 'var(--color-outline-variant)', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-outline-variant)')}
                      title={m.user_id === user?.id ? 'Leave group' : 'Remove member'}
                    >
                      {m.user_id === user?.id ? <LogOut size={14} /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="text-title-lg" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Invite Link</h3>
          {data.invite_token && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', border: '1px solid var(--color-outline-variant)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '600', wordBreak: 'break-all', color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.invite_token}</p>
              <button onClick={copyInviteToken} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#1b5e20' : 'var(--color-on-surface-variant)' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default GroupRightSidebar;
