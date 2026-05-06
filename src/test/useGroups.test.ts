import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => {
        const chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          is: vi.fn(() => chain),
          // We will override these per test using mockImplementation
        };
        return chain;
      }),
    },
  };
});

describe('useGroups hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array if user is not logged in', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useGroups());

    expect(result.current.loading).toBe(true);
    expect(result.current.groups).toEqual([]);
    
    // It should eventually set loading to false and still have empty groups?
    // Wait, in useGroups: `if (!user) return;` The effect just doesn't do anything if user is null.
    // Let's check useGroups logic: 
    // const [loading, setLoading] = useState(true);
    // const fetchGroups = ... if (!user) return; ...
    // So if !user, it remains loading: true.
    expect(result.current.loading).toBe(true);
  });

  it('should fetch and format groups correctly', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user1' } } as any);

    const mockSupabaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
    };

    // Override the mock to return specific data
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      const chain = { ...mockSupabaseChain };
      if (table === 'group_members') {
        // We have two calls to group_members: one with eq('user_id'), one with in('group_id')
        chain.eq = vi.fn().mockResolvedValue({
          data: [
            {
              role: 'admin',
              group_id: 'g1',
              groups: { id: 'g1', name: 'Group 1', description: null, group_type: 'trip', invite_token: 'tok' }
            }
          ],
          error: null
        });
        chain.in = vi.fn().mockResolvedValue({
          data: [{ group_id: 'g1' }, { group_id: 'g1' }] // 2 members
        });
      } else if (table === 'expenses') {
        chain.is = vi.fn().mockResolvedValue({
          data: [
            {
              id: 'e1',
              group_id: 'g1',
              paid_by: 'user1',
              expense_participants: [
                { user_id: 'user1', share_amount: 50, is_payer: true },
                { user_id: 'user2', share_amount: 50, is_payer: false }
              ]
            }
          ]
        });
      } else if (table === 'settlements') {
        chain.eq = vi.fn().mockResolvedValue({
          data: []
        });
      }
      return chain as any;
    });

    const { result } = renderHook(() => useGroups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0]).toEqual({
      id: 'g1',
      name: 'Group 1',
      description: null,
      group_type: 'trip',
      member_count: 2,
      my_balance: 50, // user1 paid, user2 owes 50
      my_role: 'admin',
      invite_token: 'tok',
    });
  });
});
