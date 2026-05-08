import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Expense } from '../types/database';

export interface DashboardStats {
  totalBalance: number;  // net across all groups
  youAreOwed: number;
  youOwe: number;
  groupCount: number;
  pendingSettlementsCount: number;
  openDisputesCount: number;
}

type ExpensesCache = {
  userId: string;
  recentExpenses: Expense[];
  stats: DashboardStats;
};

let expensesCache: ExpensesCache | null = null;

export function useExpenses() {
  const { user } = useAuth();
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0, youAreOwed: 0, youOwe: 0,
    groupCount: 0, pendingSettlementsCount: 0, openDisputesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && expensesCache?.userId === user.id) {
      setRecentExpenses(expensesCache.recentExpenses);
      setStats(expensesCache.stats);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get user's group IDs
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      const groupIds = (memberships ?? []).map(m => m.group_id);

      let youAreOwed = 0;
      let youOwe = 0;

      if (groupIds.length > 0) {
        // All expenses in user's groups
        const { data: expenses } = await supabase
          .from('expenses')
          .select('id, group_id, paid_by, expense_participants(user_id, share_amount)')
          .in('group_id', groupIds)
          .is('deleted_at', null);

        (expenses ?? []).forEach(exp => {
          const participants = (exp.expense_participants ?? []) as { user_id: string; share_amount: number }[];
          participants.forEach(ep => {
            if (exp.paid_by === user.id && ep.user_id !== user.id) {
              youAreOwed += Number(ep.share_amount);
            } else if (exp.paid_by !== user.id && ep.user_id === user.id) {
              youOwe += Number(ep.share_amount);
            }
          });
        });

        // Factor in confirmed settlements
        const { data: settlements } = await supabase
          .from('settlements')
          .select('payer_id, payee_id, amount')
          .in('group_id', groupIds)
          .eq('status', 'confirmed');
        settlements?.forEach(s => {
          if (s.payer_id === user.id) youOwe = Math.max(0, youOwe - Number(s.amount));
          else if (s.payee_id === user.id) youAreOwed = Math.max(0, youAreOwed - Number(s.amount));
        });
      }

      // Recent expenses across all groups
      let recentQuery = supabase
        .from('expenses')
        .select(`id, group_id, description, amount, currency, paid_by, category, created_at,
          profiles!expenses_paid_by_fkey(id, display_name),
          groups(id, name),
          expense_participants(user_id, share_amount, is_payer)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(8);
      if (groupIds.length > 0) {
        recentQuery = recentQuery.in('group_id', groupIds);
      }
      const { data: recent } = await recentQuery;

      // Pending settlements count
      const { count: pendingCount } = await supabase
        .from('settlements')
        .select('id', { count: 'exact', head: true })
        .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
        .eq('status', 'pending');

      // Open disputes count
      const { count: disputeCount } = await supabase
        .from('disputes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats({
        youAreOwed,
        youOwe,
        totalBalance: youAreOwed - youOwe,
        groupCount: groupIds.length,
        pendingSettlementsCount: pendingCount ?? 0,
        openDisputesCount: disputeCount ?? 0,
      });
      const mappedRecent = (recent ?? []) as unknown as Expense[];
      const mappedStats: DashboardStats = {
        youAreOwed,
        youOwe,
        totalBalance: youAreOwed - youOwe,
        groupCount: groupIds.length,
        pendingSettlementsCount: pendingCount ?? 0,
        openDisputesCount: disputeCount ?? 0,
      };

      setStats(mappedStats);
      setRecentExpenses(mappedRecent);
      expensesCache = { userId: user.id, recentExpenses: mappedRecent, stats: mappedStats };
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { recentExpenses, stats, loading, error, refetch };
}
