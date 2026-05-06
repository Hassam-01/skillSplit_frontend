import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction } from '../utils/auditLog';
import { supabase } from '../utils/supabase';

vi.mock('../utils/supabase', () => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  return {
    supabase: {
      from: vi.fn(() => ({
        insert: insertMock,
      })),
    },
  };
});

describe('auditLog util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call supabase.from("audit_log").insert with correct params', async () => {
    await logAction({
      groupId: 'g1',
      actorId: 'u1',
      action: 'created_expense',
      targetId: 'e1',
      targetType: 'expense',
      newValue: { amount: 100 },
    });

    expect(supabase.from).toHaveBeenCalledWith('audit_log');
    
    // Check that insert was called with the correct object
    const fromChain = supabase.from('audit_log');
    expect(fromChain.insert).toHaveBeenCalledWith({
      group_id: 'g1',
      actor_id: 'u1',
      action: 'created_expense',
      target_id: 'e1',
      target_type: 'expense',
      old_value: null,
      new_value: { amount: 100 },
    });
  });

  it('should swallow errors silently', async () => {
    const fromChain = supabase.from('audit_log');
    vi.mocked(fromChain.insert).mockRejectedValueOnce(new Error('Network error'));
    
    // Promise should resolve without throwing
    await expect(logAction({
      groupId: 'g2',
      actorId: 'u2',
      action: 'deleted_expense',
    })).resolves.toBeUndefined();
  });
});
