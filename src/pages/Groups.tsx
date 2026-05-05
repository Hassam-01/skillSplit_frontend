import { useState } from 'react';
import { Users, UserPlus, ShieldCheck, ChevronRight, Plus, AlertCircle, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import CreateGroupModal from '../components/CreateGroupModal';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const GROUP_TYPE_EMOJI: Record<string, string> = { trip: '✈️', household: '🏠', office: '💼', event: '🎉', general: '👥' };

const Groups = () => {
  const { user } = useAuth();
  const { groups, loading, error, refetch } = useGroups();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

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

      // Check if already a member
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

  return (
    <div>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-headline-lg">Your Groups</h2>
          <p className="text-body-lg">Manage your shared ledgers and financial alliances.</p>
        </div>
        <button className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsCreateOpen(true)}>
          <Plus size={20} /> Create Group
        </button>
      </header>

      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={refetch} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
        <section>
          <h3 className="text-title-lg" style={{ marginBottom: '2rem' }}>Your Alliances</h3>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-error)' }}>
              <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[0, 1, 2].map(i => <div key={i} className="surface-lowest" style={{ height: '80px', borderRadius: 'var(--radius-md)', opacity: 0.5 }} />)}
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-on-surface-variant)' }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No groups yet</p>
              <p style={{ fontSize: '0.9rem' }}>Create your first group or join one with an invite code.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="surface-lowest" style={{ padding: '1.5rem 2.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateX(8px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {GROUP_TYPE_EMOJI[group.group_type] ?? '👥'}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '700' }}>{group.name}</h4>
                        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{group.member_count} Member{group.member_count !== 1 ? 's' : ''} • {group.group_type}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                          {group.my_balance > 0.01 ? 'You are owed' : group.my_balance < -0.01 ? 'You owe' : 'Settled'}
                        </p>
                        <p style={{ fontWeight: '700', fontSize: '1.125rem', color: group.my_balance > 0.01 ? '#1b5e20' : group.my_balance < -0.01 ? '#b71c1c' : 'var(--color-on-surface)' }}>
                          Rs. {Math.abs(group.my_balance).toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight size={24} style={{ color: 'var(--color-outline-variant)' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="surface-high" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <UserPlus size={24} color="var(--color-primary)" />
              <h3 className="text-title-lg" style={{ fontSize: '1.125rem' }}>Join with Code</h3>
            </div>
            <p className="text-body-lg" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter a provided invite token to join an existing group.</p>
            <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Paste invite token…"
              style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center', fontWeight: '600', fontFamily: 'var(--font-body)', outline: 'none' }} />
            {joinError && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{joinError}</p>}
            {joinSuccess && <p style={{ color: '#1b5e20', fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: '600' }}>{joinSuccess}</p>}
            <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleJoin} disabled={joinLoading || !inviteCode.trim()}>
              {joinLoading ? <Loader size={16} /> : null}
              {joinLoading ? 'Joining…' : 'Join Alliance'}
            </button>
          </div>

          <div className="surface-low" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <h3 className="text-title-lg" style={{ fontSize: '1.125rem' }}>Verified Groups</h3>
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
