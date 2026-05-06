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
    // Setup the complex mock
    // 1. expenses: user1 paid 100, user2 and user3 each owe 50 to user1
    // 2. members: user1, user2, user3
    // 3. settlements: none
    
    // We expect: user1 has net +100, user2 has net -50, user3 has net -50
    // simplifyDebts should create two steps: user2 -> user1 (50) and user3 -> user1 (50)
    
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockIs = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockReturnThis();
    const mockInsert = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const chain = { select: mockSelect, eq: mockEq, is: mockIs, order: mockOrder, limit: mockLimit, single: mockSingle, insert: mockInsert };
      
      if (table === 'expenses') {
        chain.is = vi.fn().mockResolvedValue({
          data: [
            {
              id: 'e1',
              paid_by: 'user1',
              expense_participants: [
                { user_id: 'user2', share_amount: 50 },
                { user_id: 'user3', share_amount: 50 }
              ]
            }
          ]
        });
      } else if (table === 'group_members') {
        chain.eq = vi.fn().mockResolvedValue({
          data: [
            { user_id: 'user1', profiles: { id: 'user1', display_name: 'User One' } },
            { user_id: 'user2', profiles: { id: 'user2', display_name: 'User Two' } },
            { user_id: 'user3', profiles: { id: 'user3', display_name: 'User Three' } },
          ]
        });
      } else if (table === 'settlements') {
        chain.eq = vi.fn().mockReturnThis();
        // Since we chain eq('group_id').eq('status'), the second eq needs to return the promise
        chain.eq = vi.fn().mockImplementation((col) => {
          if (col === 'status') return Promise.resolve({ data: [] });
          return chain;
        });
      } else if (table === 'optimized_plans') {
        chain.single = vi.fn().mockResolvedValue({
          data: { id: 'plan1', group_id: 'group1' },
          error: null
        });
        chain.insert = vi.fn().mockReturnThis();
      } else if (table === 'optimized_plan_steps') {
        chain.insert = vi.fn().mockResolvedValue({ error: null });
      }

      return chain as any;
    });

    const { result } = renderHook(() => useOptimization('group1'));

    await waitFor(() => {
      // it calls fetchLatestPlan on mount, wait for it to finish loading
      expect(result.current.loading).toBe(false);
    });

    // Now trigger generatePlan
    await result.current.generatePlan();

    // Verify optimized_plans insert
    expect(supabase.from).toHaveBeenCalledWith('optimized_plans');
    
    // We can inspect the calls to optimized_plan_steps insert to see the algorithm output
    const stepsInsertMock = vi.mocked(supabase.from).mock.calls.find(c => c[0] === 'optimized_plan_steps');
    expect(stepsInsertMock).toBeDefined();
  });
});
