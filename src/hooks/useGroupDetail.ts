import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Expense, GroupMember, Profile } from '../types/database';

export interface MemberBalance {
  userId: string;
  displayName: string;
  netBalance: number; // positive = they owe me, negative = I owe them
}

export interface GroupDetailData {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  invite_token: string | null;
  created_at: string;
  members: GroupMember[];
  expenses: Expense[];
  memberBalances: MemberBalance[];
  pendingSettlements: any[]; // Adjust type as needed
  allSettlements: any[];
  totalSpending: number;
}

export function useGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!user || !groupId) return;
    setLoading(true);
    setError(null);
    try {
      // Group info
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .select('id, name, description, group_type, invite_token, created_at')
        .eq('id', groupId)
        .single();
      if (gErr) throw gErr;

      // Members with profiles
      const { data: members } = await supabase
        .from('group_members')
        .select('id, group_id, user_id, role, joined_at, profiles(id, display_name, phone)')
        .eq('group_id', groupId);

      // Expenses with participants and payer profile
      const { data: expenses } = await supabase
        .from('expenses')
        .select(`id, group_id, description, amount, currency, paid_by, split_type, category, is_treat, is_personal, is_settled, notes, receipt_url, created_by, created_at, updated_at, deleted_at,
          profiles!expenses_paid_by_fkey(id, display_name),
          expense_participants(id, expense_id, user_id, share_amount, share_percent, is_payer, profiles(id, display_name)),
          disputes(status)`)
        .eq('group_id', groupId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Pairwise balance calculation
      // debts[from][to] = amount from owes to
      const debts: Record<string, Record<string, number>> = {};
      let totalSpending = 0;

      (expenses ?? []).forEach(exp => {
        // Check if there's any active dispute
        const activeDisputes = (exp.disputes as any[])?.filter(d => d.status === 'open' || d.status === 'pending');
        const isDisputed = activeDisputes && activeDisputes.length > 0;

        // Skip disputed expenses from balance calculations
        if (isDisputed) return;

        totalSpending += Number(exp.amount);
        const payerId = exp.paid_by;
        const participants = (exp.expense_participants ?? []) as { user_id: string; share_amount: number; is_payer: boolean }[];
        participants.forEach(ep => {
          if (ep.user_id === payerId) return;
          const from = ep.user_id;
          const to = payerId;
          if (!debts[from]) debts[from] = {};
          if (!debts[from][to]) debts[from][to] = 0;
          debts[from][to] += Number(ep.share_amount);
        });
      });

      // Settlements
      const { data: allSettlements } = await supabase
        .from('settlements')
        .select('id, group_id, payer_id, payee_id, amount, status, payment_method, notes, created_at, profiles!settlements_payer_id_fkey(display_name)')
        .eq('group_id', groupId);

      const confirmedSettlements = allSettlements?.filter(s => s.status === 'confirmed') ?? [];
      const pendingSettlements = allSettlements?.filter(s => s.status === 'pending') ?? [];

      confirmedSettlements.forEach(s => {
        // settlement reduces debt: payer_id was paying payee_id
        if (!debts[s.payer_id]) debts[s.payer_id] = {};
        if (!debts[s.payer_id][s.payee_id]) debts[s.payer_id][s.payee_id] = 0;
        debts[s.payer_id][s.payee_id] = Math.max(0, debts[s.payer_id][s.payee_id] - Number(s.amount));
      });

      // For each other member, compute net balance from my perspective
      const memberBalances: MemberBalance[] = (members ?? [])
        .filter(m => m.user_id !== user.id)
        .map(m => {
          const theyOweMe = debts[m.user_id]?.[user.id] ?? 0;
          const iOweThem = debts[user.id]?.[m.user_id] ?? 0;
          const net = theyOweMe - iOweThem;
          const rawProfile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          const profile = rawProfile as unknown as Profile | null;
          return {
            userId: m.user_id,
            displayName: profile?.display_name ?? 'Unknown',
            netBalance: net,
          };
        });

      setData({
        id: group.id,
        name: group.name,
        description: group.description,
        group_type: group.group_type,
        invite_token: group.invite_token,
        created_at: group.created_at,
<<<<<<< HEAD
        members: (members ?? []) as any,
        expenses: (expenses ?? []) as unknown as Expense[],
=======
        members: (members ?? []).map(m => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        })) as unknown as GroupMember[],
        expenses: (expenses ?? []).map(e => ({
          ...e,
          profiles: Array.isArray(e.profiles) ? e.profiles[0] : e.profiles,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expense_participants: (e.expense_participants as any[] ?? []).map(ep => ({
            ...ep,
            profiles: Array.isArray(ep.profiles) ? ep.profiles[0] : ep.profiles
          }))
        })) as unknown as Expense[],
>>>>>>> eb92252f72d80b3617a563dcdf981ff82d9086d4
        memberBalances,
        pendingSettlements,
        allSettlements: allSettlements ?? [],
        totalSpending,
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, groupId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refetch: fetchDetail };
}
