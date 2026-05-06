import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGroupDetail } from '../hooks/useGroupDetail';
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

describe('useGroupDetail hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('should fetch group details and calculate member balances correctly', async () => {
    const createChain = (finalResult: any) => {
      const chain: any = Promise.resolve(finalResult);
      ['select', 'eq', 'in', 'is', 'or', 'order', 'limit', 'single'].forEach(m => {
        chain[m] = vi.fn(() => chain);
      });
      return chain;
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'groups') {
        return createChain({
          data: { id: 'g1', name: 'Trip', description: 'Fun', group_type: 'trip', created_at: '2024-01-01' }
        });
      }
      if (table === 'group_members') {
        return createChain({
          data: [
            { id: 'm1', user_id: 'u1', role: 'admin', profiles: { id: 'u1', display_name: 'Me' } },
            { id: 'm2', user_id: 'u2', role: 'member', profiles: { id: 'u2', display_name: 'Friend' } }
          ]
        });
      }
      if (table === 'expenses') {
        return createChain({
          data: [
            {
              id: 'e1',
              paid_by: 'u1',
              amount: 100,
              expense_participants: [
                { user_id: 'u1', share_amount: 50, is_payer: true },
                { user_id: 'u2', share_amount: 50, is_payer: false }
              ]
            }
          ]
        });
      }
      if (table === 'settlements') {
        return createChain({ data: [] });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useGroupDetail('g1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.name).toBe('Trip');
    expect(result.current.data?.memberBalances).toHaveLength(1);
    expect(result.current.data?.memberBalances[0]).toEqual({
      userId: 'u2',
      displayName: 'Friend',
      netBalance: 50, // u2 owes u1 50
    });
    expect(result.current.data?.totalSpending).toBe(100);
  });

  it('should factor confirmed settlements into balances', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
        const createChain = (finalResult: any) => {
            const chain: any = Promise.resolve(finalResult);
            ['select', 'eq', 'in', 'is', 'or', 'order', 'limit', 'single'].forEach(m => {
              chain[m] = vi.fn(() => chain);
            });
            return chain;
          };

      if (table === 'groups') return createChain({ data: { id: 'g1', name: 'G' } });
      if (table === 'group_members') return createChain({ data: [{ user_id: 'u1', profiles: {} }, { user_id: 'u2', profiles: { display_name: 'F' } }] });
      if (table === 'expenses') return createChain({ data: [{ paid_by: 'u1', amount: 100, expense_participants: [{ user_id: 'u1', share_amount: 50 }, { user_id: 'u2', share_amount: 50 }] }] });
      if (table === 'settlements') {
          // u2 paid u1 30
          return createChain({ data: [{ payer_id: 'u2', payee_id: 'u1', amount: 30, status: 'confirmed' }] });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useGroupDetail('g1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial debt: u2 owes u1 50
    // Settlement: u2 paid u1 30
    // Remaining netBalance for u2 from u1's perspective: 50 - 30 = 20
    expect(result.current.data?.memberBalances[0].netBalance).toBe(20);
  });
});
