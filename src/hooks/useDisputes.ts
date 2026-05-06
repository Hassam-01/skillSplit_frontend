import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Dispute } from '../types/database';

export interface DisputeWithDetail extends Dispute {
  groupName?: string;
  expenseDescription?: string;
  expenseAmount?: number;
  raisedByName?: string;
  resolvedByName?: string;
}

export function useDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<DisputeWithDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Get groups user belongs to
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      const groupIds = (memberships ?? []).map(m => m.group_id);
      if (groupIds.length === 0) { setDisputes([]); return; }

      // Get all expenses in user's groups
      const { data: groupExpenses } = await supabase
        .from('expenses')
        .select('id')
        .in('group_id', groupIds);
      const expenseIds = (groupExpenses ?? []).map(e => e.id);
      if (expenseIds.length === 0) { setDisputes([]); return; }

      // Disputes for those expenses
      const { data: rawDisputes, error: dErr } = await supabase
        .from('disputes')
        .select(`id, expense_id, raised_by, reason, status, resolved_by, resolution_note, created_at, resolved_at,
          expenses(id, description, amount, group_id, groups(id, name)),
          profiles!disputes_raised_by_fkey(id, display_name)`)
        .in('expense_id', expenseIds)
        .order('created_at', { ascending: false });
      if (dErr) throw dErr;

      const result: DisputeWithDetail[] = (rawDisputes ?? []).map(d => {
        const rawExp = Array.isArray(d.expenses) ? d.expenses[0] : d.expenses;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exp = rawExp as { description: string; amount: number; group_id: string; groups: any } | null;
        const rawGroup = Array.isArray(exp?.groups) ? exp.groups[0] : exp?.groups;
        const group = rawGroup as { name: string } | null;
        
        const rawRaisedBy = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
        const raisedByProfile = rawRaisedBy as { display_name: string | null } | null;
        return {
          ...d,
          groupName: group?.name,
          expenseDescription: exp?.description,
          expenseAmount: exp?.amount,
          raisedByName: raisedByProfile?.display_name ?? 'Unknown',
        } as unknown as DisputeWithDetail;
      });

      setDisputes(result);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const resolveDispute = async (disputeId: string, note: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('disputes')
      .update({ status: 'resolved', resolved_by: user.id, resolution_note: note, resolved_at: new Date().toISOString() })
      .eq('id', disputeId);
    if (!error) await fetchDisputes();
    return error;
  };

  const dismissDispute = async (disputeId: string) => {
    const { error } = await supabase
      .from('disputes')
      .update({ status: 'dismissed' })
      .eq('id', disputeId);
    if (!error) await fetchDisputes();
    return error;
  };

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return { disputes, loading, error, refetch: fetchDisputes, resolveDispute, dismissDispute };
}
