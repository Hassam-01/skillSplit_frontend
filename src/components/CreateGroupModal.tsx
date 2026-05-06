import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/auditLog';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const GROUP_TYPES = ['general', 'trip', 'household', 'event', 'office'];

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({ name: name.trim(), description: description.trim() || null, group_type: groupType, created_by: user.id })
        .select()
        .single();
      if (gErr) throw gErr;

      // Add creator as admin member
      const { error: mErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
      if (mErr) throw mErr;

      // Log action
      await logAction({ groupId: group.id, actorId: user.id, action: 'created_group', targetId: group.id, targetType: 'group', newValue: { name: group.name } });

      setName(''); setDescription(''); setGroupType('general');
      onCreated();
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
    fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(27,29,14,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="surface-lowest" style={{ width: '100%', maxWidth: '440px', borderRadius: 'var(--radius-xl)', padding: '2rem', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Users size={20} />
          </div>
          <h2 className="text-headline-lg" style={{ fontSize: '1.25rem' }}>Create New Group</h2>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Group Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lahore Trip" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'transparent'} />
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this group for?" rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'transparent'} />
          </div>

          <div>
            <label className="text-label-sm" style={{ display: 'block', marginBottom: '0.5rem' }}>Group Type</label>
            <select value={groupType} onChange={e => setGroupType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {GROUP_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'rgba(186,26,26,0.05)', borderRadius: 'var(--radius-md)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-gradient" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
