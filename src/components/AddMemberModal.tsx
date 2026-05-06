import React, { useState } from 'react';
import { X, Search, UserPlus, Loader } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Profile } from '../types/database';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onAdded: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, groupId, onAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let query = searchQuery.trim();
      // If starts with 03, also try searching for +923
      const alternateQuery = query.startsWith('03') ? '+92' + query.substring(1) : query.startsWith('+92') ? '0' + query.substring(3) : query;
      
      const { data, error: sErr } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.ilike.%${query}%,phone.ilike.%${alternateQuery}%,display_name.ilike.%${query}%`)
        .limit(10);
      
      if (sErr) throw sErr;
      setResults(data || []);
      if (data?.length === 0) setError('No users found with that phone number or name.');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (userId: string) => {
    setAddingId(userId);
    setError(null);
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        setError('User is already a member of this group.');
        return;
      }

      const { error: mErr } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member'
        });
      
      if (mErr) throw mErr;
      
      onAdded();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setAddingId(null);
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

        <h2 className="text-headline-lg" style={{ fontSize: '1.25rem', marginBottom: '1.75rem' }}>Add Member</h2>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search by phone (03xx...) or name…" 
              style={inputStyle}
              required
            />
          </div>
          <button type="submit" className="btn-gradient" style={{ padding: '0.75rem 1rem' }} disabled={loading} aria-label="Search">
            {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </form>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-outline-variant)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.5rem', fontWeight: '600' }}>Quick Tip:</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-on-surface)' }}>
            Can't find them? Tell them to join SkillSplit and set their name, or share the group invite link from the sidebar!
          </p>
        </div>

        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(186,26,26,0.05)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map(profile => (
            <div key={profile.id} className="surface-low" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{profile.display_name || 'Anonymous'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{profile.phone}</p>
              </div>
              <button 
                onClick={() => handleAdd(profile.id)} 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                disabled={addingId === profile.id}
              >
                {addingId === profile.id ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
