import { useMemo, useState } from 'react';
import { PlusCircle, CheckCircle, AlertCircle, UserPlus, Clock, RefreshCw, Zap, Trash2, Target, Search } from 'lucide-react';
import { useActivityLog } from '../hooks/useActivityLog';
import type { AuditLog, Profile, Group } from '../types/database';

const ACTION_META: Record<string, { icon: React.ReactNode; color: string }> = {
  created_group: { icon: <UserPlus size={18} color="var(--color-primary)" />, color: 'var(--color-primary)' },
  expense_added: { icon: <PlusCircle size={18} color="var(--color-primary-container)" />, color: 'var(--color-primary-container)' },
  expense_updated: { icon: <RefreshCw size={18} color="var(--color-primary)" />, color: 'var(--color-primary)' },
  expense_deleted: { icon: <Trash2 size={18} color="var(--color-error)" />, color: 'var(--color-error)' },
  settlement_created: { icon: <CheckCircle size={18} color="var(--color-success)" />, color: 'var(--color-success)' },
  settlement_confirmed: { icon: <CheckCircle size={18} color="var(--color-success)" />, color: 'var(--color-success)' },
  dispute_raised: { icon: <AlertCircle size={18} color="var(--color-error)" />, color: 'var(--color-error)' },
  dispute_resolved: { icon: <CheckCircle size={18} color="var(--color-success)" />, color: 'var(--color-success)' },
  member_added: { icon: <UserPlus size={18} color="var(--color-primary)" />, color: 'var(--color-primary)' },
  member_removed: { icon: <Trash2 size={18} color="var(--color-error)" />, color: 'var(--color-error)' },
  pool_created: { icon: <Target size={18} color="var(--color-tertiary)" />, color: 'var(--color-tertiary)' },
  optimization_generated: { icon: <Zap size={18} color="var(--color-on-tertiary-container)" />, color: 'var(--color-on-tertiary-container)' },
};

const getActionMeta = (action: string) => ACTION_META[action] ?? { icon: <PlusCircle size={18} color="var(--color-on-surface-variant)" />, color: 'var(--color-on-surface-variant)' };

const formatAction = (log: AuditLog): string => {
  const actor = (log.profiles as unknown as Profile | null)?.display_name ?? 'Someone';
  const group = (log.groups as unknown as Group | null)?.name ?? '';
  const targetName = (log.new_value as any)?.description || (log.new_value as any)?.name || (log.new_value as any)?.displayName || '';

  switch (log.action) {
    case 'created_group': return `${actor} created group "${group}"`;
    case 'expense_added': return `${actor} added expense "${targetName}" in "${group}"`;
    case 'expense_updated': return `${actor} updated expense "${targetName}" in "${group}"`;
    case 'expense_deleted': return `${actor} deleted an expense in "${group}"`;
    case 'settlement_created': return `${actor} marked a payment of Rs. ${(log.new_value as any)?.amount?.toLocaleString()} in "${group}"`;
    case 'settlement_confirmed': return `${actor} confirmed a payment in "${group}"`;
    case 'dispute_raised': return `${actor} raised a dispute in "${group}"`;
    case 'dispute_resolved': return `${actor} resolved a dispute in "${group}"`;
    case 'member_added': return `${actor} added a member to "${group}"`;
    case 'member_removed': return `${actor} removed a member from "${group}"`;
    case 'pool_created': return `${actor} created a central pool "${targetName}" in "${group}"`;
    case 'optimization_generated': return `${actor} generated an optimization plan for "${group}"`;
    default: return `${actor} performed action: ${log.action}`;
  }
};

const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

const ActivityLog = () => {
  const { activityGroups, loading, error, refetch } = useActivityLog();
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const groupOptions = useMemo(() => {
    const names = new Set<string>();
    activityGroups.forEach(day => day.items.forEach(item => {
      const groupName = (item.groups as unknown as Group | null)?.name;
      if (groupName) names.add(groupName);
    }));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [activityGroups]);

  const actionOptions = useMemo(() => {
    const actions = new Set<string>();
    activityGroups.forEach(day => day.items.forEach(item => actions.add(item.action)));
    return Array.from(actions).sort((a, b) => a.localeCompare(b));
  }, [activityGroups]);

  const filteredGroups = useMemo(() => {
    const now = Date.now();
    const queryText = query.trim().toLowerCase();

    const dayLimitMs =
      timeFilter === '24h' ? 24 * 60 * 60 * 1000 :
      timeFilter === '7d' ? 7 * 24 * 60 * 60 * 1000 :
      timeFilter === '30d' ? 30 * 24 * 60 * 60 * 1000 :
      null;

    return activityGroups
      .map(group => {
        const items = group.items.filter((log: AuditLog) => {
          if (actionFilter !== 'all' && log.action !== actionFilter) return false;

          const groupName = (log.groups as unknown as Group | null)?.name ?? '';
          if (groupFilter !== 'all' && groupName !== groupFilter) return false;

          if (dayLimitMs !== null) {
            const logTime = new Date(log.created_at).getTime();
            if (now - logTime > dayLimitMs) return false;
          }

          if (!queryText) return true;

          const haystack = `${formatAction(log)} ${groupName} ${log.action}`.toLowerCase();
          return haystack.includes(queryText);
        });

        return { ...group, items };
      })
      .filter(group => group.items.length > 0);
  }, [activityGroups, query, actionFilter, groupFilter, timeFilter]);

  const hasFilters = query || actionFilter !== 'all' || groupFilter !== 'all' || timeFilter !== 'all';

  return (
    <div style={{ width: '100%' }}>
      <header style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <h2 className="text-headline-lg">Activity Log</h2>
          <p className="text-body-lg" style={{ fontSize: '0.9rem' }}>Track actions across your groups in one clean timeline.</p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontWeight: '600', fontSize: '0.875rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <section className="surface-low" style={{ padding: '0.9rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 2fr) repeat(3, minmax(150px, 1fr)) auto', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-on-surface-variant)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search activity"
              style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.2rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-container-lowest)', fontSize: '0.86rem', outline: 'none' }}
            />
          </div>

          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: '0.55rem 0.6rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-container-lowest)', fontSize: '0.84rem' }}>
            <option value="all">All actions</option>
            {actionOptions.map(action => (
              <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{ padding: '0.55rem 0.6rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-container-lowest)', fontSize: '0.84rem' }}>
            <option value="all">All groups</option>
            {groupOptions.map(groupName => (
              <option key={groupName} value={groupName}>{groupName}</option>
            ))}
          </select>

          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '0.55rem 0.6rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-container-lowest)', fontSize: '0.84rem' }}>
            <option value="all">All time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <button
            onClick={() => { setQuery(''); setActionFilter('all'); setGroupFilter('all'); setTimeFilter('all'); }}
            disabled={!hasFilters}
            style={{ padding: '0.55rem 0.7rem', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', background: 'none', color: hasFilters ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)', cursor: hasFilters ? 'pointer' : 'default', fontSize: '0.82rem', fontWeight: 600 }}
          >
            Clear
          </button>
        </div>
      </section>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-on-surface-variant)' }}>Loading activity…</div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-on-surface-variant)' }}>
          <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '600' }}>{hasFilters ? 'No matching activity' : 'No activity yet'}</p>
          <p style={{ fontSize: '0.9rem' }}>{hasFilters ? 'Try changing filters or clearing search.' : 'Activity will appear here as you and your group members take actions.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {filteredGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-title-lg" style={{ marginBottom: '0.65rem', opacity: 0.7, fontSize: '1rem' }}>{group.day}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }}>
                {group.items.map((log: AuditLog) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <div key={log.id} className="surface-lowest" style={{ padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', minWidth: 0 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {meta.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatAction(log)}</p>
                          {(log.groups as unknown as Group | null)?.name && (
                            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                              {(log.groups as unknown as Group | null)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                        <Clock size={12} /> {formatTime(log.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 980px) {
          section[style*='grid-template-columns: minmax(260px, 2fr) repeat(3, minmax(150px, 1fr)) auto'] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          section[style*='grid-template-columns: minmax(260px, 2fr) repeat(3, minmax(150px, 1fr)) auto'] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ActivityLog;
