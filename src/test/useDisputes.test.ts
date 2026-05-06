import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDisputes } from '../hooks/useDisputes';
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

describe('useDisputes hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('should fetch and format disputes correctly', async () => {
    const createChain = (finalResult: any) => {
      const chain: any = Promise.resolve(finalResult);
      ['select', 'eq', 'in', 'is', 'or', 'order', 'limit', 'single'].forEach(m => {
        chain[m] = vi.fn(() => chain);
      });
      return chain;
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'group_members') {
        return createChain({ data: [{ group_id: 'g1' }] });
      }
      if (table === 'expenses') {
        return createChain({ data: [{ id: 'e1' }] });
      }
      if (table === 'disputes') {
        return createChain({
          data: [
            {
              id: 'd1',
              expense_id: 'e1',
              reason: 'Wrong split',
              status: 'open',
              created_at: '2024-01-01',
              expenses: { description: 'Lunch', amount: 100, groups: { name: 'Food Group' } },
              profiles: { display_name: 'Reporter' }
            }
          ]
        });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useDisputes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.disputes).toHaveLength(1);
    expect(result.current.disputes[0]).toEqual(expect.objectContaining({
      reason: 'Wrong split',
      expenseDescription: 'Lunch',
      groupName: 'Food Group',
      raisedByName: 'Reporter',
    }));
  });

  it('should resolve a dispute correctly', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: updateMock,
        order: vi.fn().mockReturnThis(),
      };
      // Chain setup for initial fetch
      if (table === 'group_members') return Promise.resolve({ data: [] }) as any;
      return chain;
    });

    const { result } = renderHook(() => useDisputes());
    
    await result.current.resolveDispute('d1', 'Fixed it');

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'resolved',
      resolution_note: 'Fixed it',
    }));
  });
});
