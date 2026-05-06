import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface GroupWithBalance {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  member_count: number;
  my_balance: number; // positive = others owe me, negative = I owe
  my_role: string;
  invite_token: string | null;
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch groups user belongs to
      const { data: memberships, error: mErr } = await supabase
        .from('group_members')
        .select('role, group_id, groups(id, name, description, group_type, invite_token)')
        .eq('user_id', user.id);
      if (mErr) throw mErr;
      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map(m => {
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        return (g as { id: string }).id;
      });

      // Member counts per group
      const { data: memberCounts } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);
      const countMap: Record<string, number> = {};
      memberCounts?.forEach(r => {
        countMap[r.group_id] = (countMap[r.group_id] || 0) + 1;
      });

      // All expenses with participants for these groups
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, group_id, paid_by, expense_participants(user_id, share_amount, is_payer)')
        .in('group_id', groupIds)
        .is('deleted_at', null);

      // Balance per group
      const balanceByGroup: Record<string, number> = {};
      expenses?.forEach(expense => {
        const gId = expense.group_id;
        if (!balanceByGroup[gId]) balanceByGroup[gId] = 0;
        const participants = (expense.expense_participants ?? []) as { user_id: string; share_amount: number; is_payer: boolean }[];
        participants.forEach(ep => {
          if (expense.paid_by === user.id && ep.user_id !== user.id) {
            // Others owe me
            balanceByGroup[gId] += ep.share_amount;
          } else if (expense.paid_by !== user.id && ep.user_id === user.id) {
            // I owe the payer
            balanceByGroup[gId] -= ep.share_amount;
          }
        });
      });

      // Also factor in confirmed settlements
      const { data: settlements } = await supabase
        .from('settlements')
        .select('group_id, payer_id, payee_id, amount')
        .in('group_id', groupIds)
        .eq('status', 'confirmed');
      settlements?.forEach(s => {
        if (!balanceByGroup[s.group_id]) balanceByGroup[s.group_id] = 0;
        if (s.payer_id === user.id) balanceByGroup[s.group_id] += s.amount;
        else if (s.payee_id === user.id) balanceByGroup[s.group_id] -= s.amount;
      });

      const result: GroupWithBalance[] = memberships.map(m => {
        const rawG = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        const g = rawG as { id: string; name: string; description: string | null; group_type: string; invite_token: string | null };
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          group_type: g.group_type,
          member_count: countMap[g.id] || 1,
          my_balance: balanceByGroup[g.id] || 0,
          my_role: m.role,
          invite_token: g.invite_token,
        };
      });

      setGroups(result);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      await fetchGroups();
    };
    load();
  }, [fetchGroups]);

  return { groups, loading, error, refetch: fetchGroups };
}
