import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('useExpenses hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('should calculate dashboard stats correctly', async () => {
    const createChain = (finalResult: any) => {
      const chain: any = Promise.resolve(finalResult);
      ['select', 'eq', 'in', 'is', 'or', 'order', 'limit', 'single'].forEach(m => {
        chain[m] = vi.fn(() => chain);
      });
      return chain;
    };

    const settlementsSelectMock = vi.fn()
      .mockImplementationOnce(() => createChain({ data: [{ payer_id: 'u1', payee_id: 'u2', amount: 10 }] }))
      .mockImplementationOnce(() => createChain({ count: 1 }));

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'group_members') {
        return createChain({ data: [{ group_id: 'G1' }] });
      }
      if (table === 'expenses') {
        return createChain({
          data: [
            { id: 'e1', paid_by: 'u1', expense_participants: [{ user_id: 'u2', share_amount: 60 }] },
            { id: 'e2', paid_by: 'u2', expense_participants: [{ user_id: 'u1', share_amount: 20 }] }
          ]
        });
      }
      if (table === 'settlements') {
        return { select: settlementsSelectMock } as any;
      }
      if (table === 'disputes') {
        return createChain({ count: 0 });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useExpenses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 4000 });

    if (result.current.error) {
      throw new Error(`Hook error: ${result.current.error}`);
    }

    expect(result.current.stats).toEqual({
      youAreOwed: 60,
      youOwe: 10,
      totalBalance: 50,
      groupCount: 1,
      pendingSettlementsCount: 1,
      openDisputesCount: 0,
    });
  });
});
