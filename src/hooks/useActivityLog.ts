import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { AuditLog } from '../types/database';

export interface ActivityGroup {
  day: string;
  items: AuditLog[];
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function useActivityLog() {
  const { user } = useAuth();
  const [activityGroups, setActivityGroups] = useState<ActivityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      const groupIds = (memberships ?? []).map(m => m.group_id);
      if (groupIds.length === 0) { setActivityGroups([]); return; }

      const { data: logs, error: lErr } = await supabase
        .from('audit_log')
        .select(`id, group_id, actor_id, action, target_id, target_type, old_value, new_value, created_at,
          profiles!audit_log_actor_id_fkey(id, display_name),
          groups(id, name)`)
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(100);
      if (lErr) throw lErr;

      const dayMap: Record<string, AuditLog[]> = {};
      (logs ?? []).forEach(log => {
        const day = formatDay(log.created_at);
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(log as unknown as AuditLog);
      });

      setActivityGroups(Object.entries(dayMap).map(([day, items]) => ({ day, items })));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activityGroups, loading, error, refetch: fetchActivity };
}
