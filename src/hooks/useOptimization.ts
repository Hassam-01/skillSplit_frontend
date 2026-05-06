import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { OptimizedPlan, OptimizedPlanStep } from '../types/database';

export interface NetBalance {
  userId: string;
  displayName: string;
  net: number; // positive = owed money, negative = owes money
}

/** Greedy debt-simplification algorithm */
function simplifyDebts(balances: NetBalance[]): { payerId: string; payeeId: string; amount: number }[] {
  const creditors = balances.filter(b => b.net > 0.01).map(b => ({ ...b })).sort((a, b) => b.net - a.net);
  const debtors = balances.filter(b => b.net < -0.01).map(b => ({ ...b })).sort((a, b) => a.net - b.net);
  const transactions: { payerId: string; payeeId: string; amount: number }[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.net, creditor.net);
    transactions.push({ payerId: debtor.userId, payeeId: creditor.userId, amount: Math.round(amount * 100) / 100 });
    debtor.net += amount;
    creditor.net -= amount;
    if (Math.abs(debtor.net) < 0.01) i++;
    if (Math.abs(creditor.net) < 0.01) j++;
  }
  return transactions;
}

export function useOptimization(groupId: string | undefined) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<OptimizedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestPlan = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('optimized_plans')
        .select(`id, group_id, generated_at, naive_count, optimized_count, is_confirmed, confirmed_by, confirmed_at,
          optimized_plan_steps(id, plan_id, step_order, payer_id, payee_id, amount, settlement_id,
            payer:profiles!optimized_plan_steps_payer_id_fkey(id, display_name),
            payee:profiles!optimized_plan_steps_payee_id_fkey(id, display_name))`)
        .eq('group_id', groupId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setPlan(data as unknown as OptimizedPlan);
    } catch {
      // no plan yet
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const generatePlan = useCallback(async () => {
    if (!groupId || !user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch all expenses + participants for group
      const { data: expenses } = await supabase
        .from('expenses')
        .select(`id, paid_by, expense_participants(user_id, share_amount, is_payer), disputes(status)`)
        .eq('group_id', groupId)
        .is('deleted_at', null);

      // Fetch members with profiles
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, profiles(id, display_name)')
        .eq('group_id', groupId);

      // Build net balances
      const netMap: Record<string, number> = {};
      (expenses ?? []).forEach(exp => {
        // Check if there's any active dispute
        const activeDisputes = (exp.disputes as { status: string }[])?.filter(d => d.status === 'open' || d.status === 'pending');
        const isDisputed = activeDisputes && activeDisputes.length > 0;

        // Skip disputed expenses from optimization calculation
        if (isDisputed) return;

        const participants = (exp.expense_participants ?? []) as { user_id: string; share_amount: number; is_payer: boolean }[];
        participants.forEach(ep => {
          if (!netMap[ep.user_id]) netMap[ep.user_id] = 0;
          if (exp.paid_by === ep.user_id) return;
          // Payer is owed ep.share_amount
          if (!netMap[exp.paid_by]) netMap[exp.paid_by] = 0;
          netMap[exp.paid_by] += Number(ep.share_amount);
          netMap[ep.user_id] -= Number(ep.share_amount);
        });
      });

      // Factor in confirmed settlements
      const { data: settlements } = await supabase
        .from('settlements')
        .select('payer_id, payee_id, amount')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');
      settlements?.forEach(s => {
        if (!netMap[s.payer_id]) netMap[s.payer_id] = 0;
        if (!netMap[s.payee_id]) netMap[s.payee_id] = 0;
        netMap[s.payer_id] += Number(s.amount);
        netMap[s.payee_id] -= Number(s.amount);
      });

      const memberMap: Record<string, string> = {};
      (members ?? []).forEach(m => {
        const profile = m.profiles as unknown as { display_name: string | null } | null;
        memberMap[m.user_id] = profile?.display_name ?? 'Unknown';
      });

      const balances: NetBalance[] = Object.entries(netMap).map(([userId, net]) => ({
        userId, net, displayName: memberMap[userId] ?? 'Unknown',
      }));

      const naiveCount = Object.values(netMap).filter(n => n < -0.01).length * Object.values(netMap).filter(n => n > 0.01).length;
      const steps = simplifyDebts(balances);

      // Insert optimized_plan
      const { data: newPlan, error: planErr } = await supabase
        .from('optimized_plans')
        .insert({ group_id: groupId, naive_count: naiveCount, optimized_count: steps.length, is_confirmed: false })
        .select()
        .single();
      if (planErr) throw planErr;

      // Insert steps
      if (steps.length > 0) {
        const stepRows = steps.map((s, idx) => ({
          plan_id: newPlan.id, step_order: idx + 1,
          payer_id: s.payerId, payee_id: s.payeeId, amount: s.amount,
        }));
        await supabase.from('optimized_plan_steps').insert(stepRows);
      }

      await fetchLatestPlan();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [groupId, user, fetchLatestPlan]);

  const confirmPlan = useCallback(async () => {
    if (!plan || !user) return;
    await supabase
      .from('optimized_plans')
      .update({ is_confirmed: true, confirmed_by: user.id, confirmed_at: new Date().toISOString() })
      .eq('id', plan.id);
    await fetchLatestPlan();
  }, [plan, user, fetchLatestPlan]);

  const settleStep = useCallback(async (step: OptimizedPlanStep) => {
    if (!groupId || !user) return;
    const { data: settlement } = await supabase
      .from('settlements')
      .insert({ group_id: groupId, payer_id: step.payer_id, payee_id: step.payee_id, amount: step.amount, status: 'pending' })
      .select()
      .single();
    if (settlement) {
      await supabase.from('optimized_plan_steps').update({ settlement_id: settlement.id }).eq('id', step.id);
    }
    await fetchLatestPlan();
  }, [groupId, user, fetchLatestPlan]);

  return { plan, loading, error, fetchLatestPlan, generatePlan, confirmPlan, settleStep };
}
