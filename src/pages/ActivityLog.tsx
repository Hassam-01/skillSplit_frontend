import { PlusCircle, CheckCircle, AlertCircle, UserPlus, Clock, RefreshCw, Zap } from 'lucide-react';
import { useActivityLog } from '../hooks/useActivityLog';
import type { AuditLog, Profile, Group } from '../types/database';

const ACTION_META: Record<string, { icon: React.ReactNode; color: string }> = {
  created_group: { icon: <UserPlus size={18} color="var(--color-primary)" />, color: 'var(--color-primary)' },
  expense_added: { icon: <PlusCircle size={18} color="#006666" />, color: '#006666' },
  settlement_created: { icon: <CheckCircle size={18} color="#1b5e20" />, color: '#1b5e20' },
  dispute_raised: { icon: <AlertCircle size={18} color="#ba1a1a" />, color: '#ba1a1a' },
  dispute_resolved: { icon: <CheckCircle size={18} color="#1b5e20" />, color: '#1b5e20' },
  optimization_generated: { icon: <Zap size={18} color="var(--color-primary)" />, color: 'var(--color-primary)' },
};

const getActionMeta = (action: string) => ACTION_META[action] ?? { icon: <PlusCircle size={18} color="var(--color-on-surface-variant)" />, color: 'var(--color-on-surface-variant)' };

const formatAction = (log: AuditLog): string => {
  const actor = (log.profiles as unknown as Profile | null)?.display_name ?? 'Someone';
  const group = (log.groups as unknown as Group | null)?.name ?? '';
  switch (log.action) {
    case 'created_group': return `${actor} created group "${group}"`;
    case 'expense_added': return `${actor} added an expense in "${group}"`;
    case 'settlement_created': return `${actor} created a settlement in "${group}"`;
    case 'dispute_raised': return `${actor} raised a dispute in "${group}"`;
    case 'dispute_resolved': return `${actor} resolved a dispute in "${group}"`;
    case 'optimization_generated': return `${actor} generated an optimization plan for "${group}"`;
    default: return `${actor} performed action: ${log.action}`;
  }
};

const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

const ActivityLog = () => {
  const { activityGroups, loading, error, refetch } = useActivityLog();

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-headline-lg">Activity Log</h2>
          <p className="text-body-lg">A chronicle of shared experiences and financial harmony.</p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--color-on-surface-variant)', fontWeight: '600', fontSize: '0.875rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(186,26,26,0.06)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', color: 'var(--color-error)' }}>
          <AlertCircle size={18} /><p style={{ fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-on-surface-variant)' }}>Loading activity…</div>
      ) : activityGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-on-surface-variant)' }}>
          <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: '600' }}>No activity yet</p>
          <p style={{ fontSize: '0.9rem' }}>Activity will appear here as you and your group members take actions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {activityGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-title-lg" style={{ marginBottom: '1.5rem', opacity: 0.6 }}>{group.day}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--color-outline-variant)' }}>
                {group.items.map((log: AuditLog) => {
                  const meta = getActionMeta(log.action);
                  return (
                    <div key={log.id} className="surface-lowest" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--color-surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {meta.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.95rem' }}>{formatAction(log)}</p>
                          {(log.groups as unknown as Group | null)?.name && (
                            <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.125rem' }}>
                              {(log.groups as unknown as Group | null)?.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, marginLeft: '1rem' }}>
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
    </div>
  );
};

export default ActivityLog;
