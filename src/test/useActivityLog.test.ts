import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActivityLog } from '../hooks/useActivityLog';
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

describe('useActivityLog hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('should fetch and group activity logs by day', async () => {
    const today = new Date().toISOString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

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
      if (table === 'audit_log') {
        return createChain({
          data: [
            { id: 'l1', action: 'created_expense', created_at: today, profiles: { display_name: 'Me' }, groups: { name: 'G1' } },
            { id: 'l2', action: 'settlement_created', created_at: yesterdayStr, profiles: { display_name: 'Friend' }, groups: { name: 'G1' } }
          ]
        });
      }
      return createChain({ data: [] });
    });

    const { result } = renderHook(() => useActivityLog());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activityGroups).toHaveLength(2);
    
    const todayGroup = result.current.activityGroups.find(g => g.day === 'Today');
    const yesterdayGroup = result.current.activityGroups.find(g => g.day === 'Yesterday');

    expect(todayGroup).toBeDefined();
    expect(yesterdayGroup).toBeDefined();
    expect(todayGroup?.items[0].action).toBe('created_expense');
    expect(yesterdayGroup?.items[0].action).toBe('settlement_created');
  });
});
