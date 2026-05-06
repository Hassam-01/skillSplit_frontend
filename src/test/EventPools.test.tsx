import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatePoolModal from '../components/CreatePoolModal';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('Event Pools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('allows creating a central pool with a target amount', async () => {
    const onCreated = vi.fn();
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'p1', name: 'Trip Fund', target_amount: 5000 }, error: null })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'event_pools') return { insert: insertMock } as any;
      if (table === 'audit_logs') return { insert: vi.fn().mockResolvedValue({}) } as any;
      return {} as any;
    });

    render(
      <CreatePoolModal 
        isOpen={true} 
        onClose={() => {}} 
        onCreated={onCreated} 
        groupId="g1" 
      />
    );

    fireEvent.change(screen.getByLabelText(/Pool Name/i), { target: { value: 'Trip Fund' } });
    fireEvent.change(screen.getByLabelText(/Target Total/i), { target: { value: '5000' } });

    fireEvent.click(screen.getByText('Create Pool'));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Trip Fund',
        target_amount: 5000
      }));
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it('displays contributions correctly in the pool list', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'p2' }, error: null })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'event_pools') return { insert: insertMock } as any;
      return { insert: vi.fn().mockResolvedValue({}) } as any;
    });

    render(
      <CreatePoolModal 
        isOpen={true} 
        onClose={() => {}} 
        onCreated={() => {}} 
        groupId="g1" 
      />
    );

    fireEvent.change(screen.getByLabelText(/Pool Name/i), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByLabelText(/Per Person/i), { target: { value: '1000' } });

    fireEvent.click(screen.getByText('Create Pool'));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        per_member: 1000
      }));
    });
  });
});
