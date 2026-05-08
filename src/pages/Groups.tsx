import { useState } from 'react';
import { Users, UserPlus, ShieldCheck, ChevronRight, Plus, AlertCircle, Loader2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import CreateGroupModal from '../components/CreateGroupModal';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const GROUP_TYPE_EMOJI: Record<string, string> = { 
  trip: '✈️', 
  household: '🏠', 
  office: '💼', 
  event: '🎉', 
  general: '👥' 
};

const Groups = () => {
  const { user } = useAuth();
  const { groups, loading, error, refetch } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleJoin = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_token', inviteCode.trim())
        .single();
      if (gErr || !group) throw new Error('Invalid invite code. Please check and try again.');

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();
      if (existing) throw new Error('You are already a member of this group.');

      const { error: mErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'member' });
      if (mErr) throw mErr;

      setJoinSuccess(`Joined "${group.name}" successfully!`);
      setInviteCode('');
      refetch();
    } catch (err: unknown) {
      setJoinError((err as Error).message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editValue.trim()) {
      setEditingGroupId(null);
      return;
    }
    try {
      const { error: uErr } = await supabase
        .from('groups')
        .update({ name: editValue.trim() })
        .eq('id', id);
      if (uErr) throw uErr;
      refetch();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setEditingGroupId(null);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header style={{ 
        marginBottom: '3rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 className="text-display-lg">Your Alliances</h2>
          <p className="text-body-lg" style={{ marginTop: '0.5rem' }}>Manage your shared ledgers and financial dynamics.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
           <div style={{ position: 'relative' }} className="sm-hide">
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)', opacity: 0.5 }} />
              <input 
                type="text" 
                placeholder="Search alliances…" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  backgroundColor: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  minWidth: '240px'
                }}
              />
           </div>
           <button className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem' }} onClick={() => setIsCreateOpen(true)}>
             <Plus size={20} /> New Group
           </button>
        </div>
      </header>

      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={refetch} />

      <div className="grid-asymmetric">
        <section>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', backgroundColor: 'var(--color-error-container)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', color: 'var(--color-error)', border: '1px solid rgba(186,26,26,0.2)' }}>
              <AlertCircle size={20} /><p style={{ fontWeight: '500' }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="surface-lowest" style={{ height: '100px', borderRadius: 'var(--radius-xl)', opacity: 0.5, animation: 'pulse 1.5s infinite ease-in-out' }} />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--color-on-surface-variant)', border: '2px dashed var(--color-outline-variant)', borderRadius: 'var(--radius-xl)' }}>
              <Users size={64} style={{ marginBottom: '1.5rem', opacity: 0.15 }} />
              <p style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>No Active Alliances</p>
              <p style={{ fontSize: '0.95rem' }}>{searchTerm ? 'No results found for your search.' : 'Create your first group to start tracking expenses.'}</p>
              {!searchTerm && (
                <button 
                  className="btn-secondary" 
                  style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Get Started
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="surface-lowest" style={{ 
                    padding: '1.5rem 2rem', 
                    borderRadius: 'var(--radius-xl)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--color-surface-container-high)',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                  }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--color-surface-container-high)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
                    }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1, minWidth: '200px' }}>
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        backgroundColor: 'var(--color-surface-container-low)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '1.75rem',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        {GROUP_TYPE_EMOJI[group.group_type] ?? '👥'}
                      </div>
                      <div>
                        {editingGroupId === group.id ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleRename(group.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(group.id)}
                            onClick={(e) => e.preventDefault()}
                            style={{ 
                              fontSize: '1.25rem', 
                              fontWeight: '700', 
                              border: 'none', 
                              borderBottom: '2px solid var(--color-primary)', 
                              backgroundColor: 'transparent', 
                              outline: 'none', 
                              padding: '0',
                              width: '100%',
                              fontFamily: 'var(--font-display)',
                              color: 'var(--color-primary)'
                            }}
                          />
                        ) : (
                          <h4 
                            className="text-title-lg"
                            style={{ fontSize: '1.25rem', cursor: 'text' }}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingGroupId(group.id);
                              setEditValue(group.name);
                            }}
                          >
                            {group.name}
                          </h4>
                        )}
                        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.25rem' }}>
                          {group.member_count} Members • <span style={{ textTransform: 'capitalize' }}>{group.group_type}</span>
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p className="text-label-sm" style={{ fontSize: '0.6rem', color: 'var(--color-on-surface-variant)' }}>
                          {group.my_balance > 0.01 ? 'Owed to you' : group.my_balance < -0.01 ? 'You owe' : 'Settled'}
                        </p>
                        <p style={{ 
                          fontWeight: '800', 
                          fontSize: '1.25rem', 
                          color: group.my_balance > 0.01 ? 'var(--color-success)' : group.my_balance < -0.01 ? 'var(--color-error)' : 'var(--color-on-surface-variant)' 
                        }}>
                          Rs. {Math.abs(group.my_balance).toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight size={24} style={{ color: 'var(--color-outline-variant)', opacity: 0.5 }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside style={{ alignSelf: 'start' }}>
          <div className="surface-high" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', position: 'sticky', top: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--color-surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} color="var(--color-primary)" />
              </div>
              <h3 className="text-title-lg">Join Alliance</h3>
            </div>
            <p className="text-body-lg" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>Enter a unique invite token to join an existing shared ledger.</p>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={inviteCode} 
                onChange={e => setInviteCode(e.target.value)} 
                placeholder="Token (e.g. ABC-123)"
                style={{ 
                  width: '100%', 
                  padding: '1rem 1.25rem', 
                  backgroundColor: 'var(--color-surface-container-lowest)', 
                  border: '2px solid var(--color-outline-variant)', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '1rem', 
                  fontSize: '1rem', 
                  textAlign: 'center', 
                  fontWeight: '700', 
                  fontFamily: 'var(--font-body)', 
                  outline: 'none',
                  letterSpacing: '0.1em',
                  transition: 'border-color 0.2s ease'
                }} 
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-outline-variant)'}
              />
            </div>

            {joinError && (
              <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <AlertCircle size={14} /> {joinError}
              </div>
            )}
            {joinSuccess && (
              <div style={{ color: 'var(--color-success)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                <ShieldCheck size={14} /> {joinSuccess}
              </div>
            )}

            <button 
              className="btn-gradient" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }} 
              onClick={handleJoin} 
              disabled={joinLoading || !inviteCode.trim()}
            >
              {joinLoading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {joinLoading ? 'Validating…' : 'Join Alliance'}
            </button>
          </div>

          <div className="surface-low" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-surface-container-high)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <h3 className="text-title-lg" style={{ fontSize: '1rem' }}>Premium Trust</h3>
            </div>
            <p className="text-body-lg" style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', lineHeight: '1.7' }}>
              SkillSplit uses proprietary <strong>Balanced Entry</strong> logic to ensure every transaction is reconciled across all participants with zero margin for error.
            </p>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.3; }
          100% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Groups;

