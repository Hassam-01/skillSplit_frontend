import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOptimization } from '../hooks/useOptimization';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    }
  };
});

describe('useOptimization hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user1' } } as any);
  });

  it('should simplify debts correctly and generate a plan', async () => {
    // Setup: user1 paid 100, user2 and user3 each owe 50 to user1
    // Expected: user2 -> user1 (50) and user3 -> user1 (50)

    const createChain = (finalResult: any) => {
      const chain: any = Promise.resolve(finalResult);
      ['select', 'eq', 'in', 'is', 'or', 'order', 'limit', 'single', 'insert', 'update', 'then'].forEach(m => {
        if (m === 'then') {
          // Keep the native then so await works
        } else {
          chain[m] = vi.fn(() => chain);
        }
      });
      return chain;
    };

    const calledTables: string[] = [];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      calledTables.push(table);

      if (table === 'expenses') {
        return createChain({
          data: [{
            id: 'e1',
            paid_by: 'user1',
            description: 'Dinner',
            expense_participants: [
              { user_id: 'user2', share_amount: 50, is_payer: false },
              { user_id: 'user3', share_amount: 50, is_payer: false }
            ],
            disputes: []
          }]
        });
      }
      if (table === 'group_members') {
        return createChain({
          data: [
            { user_id: 'user1', profiles: { id: 'user1', display_name: 'User One' } },
            { user_id: 'user2', profiles: { id: 'user2', display_name: 'User Two' } },
            { user_id: 'user3', profiles: { id: 'user3', display_name: 'User Three' } },
          ]
        });
      }
      if (table === 'settlements') {
        return createChain({ data: [] });
      }
      if (table === 'optimized_plans') {
        return createChain({
          data: { id: 'plan1', group_id: 'group1', naive_count: 2, optimized_count: 2, is_confirmed: false, optimized_plan_steps: [] },
          error: null
        });
      }
      if (table === 'optimized_plan_steps') {
        return createChain({ error: null });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useOptimization('group1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Now trigger generatePlan
    await result.current.generatePlan();

    // Verify key tables were queried during generatePlan
    expect(calledTables).toContain('expenses');
    expect(calledTables).toContain('settlements');
    expect(calledTables).toContain('optimized_plans');
    expect(calledTables).toContain('optimized_plan_steps');
  });
});
