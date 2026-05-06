import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettleUpModal from '../components/SettleUpModal';
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

describe('Settle Later Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  const memberBalances = [
    { userId: 'u1', displayName: 'You', netBalance: -1000 },
    { userId: 'u2', displayName: 'User Two', netBalance: 1000 }
  ];

  it('allows scheduling a settlement for later', async () => {
    const onSettled = vi.fn();
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'settlements') return { insert: insertMock } as any;
      if (table === 'profiles') return { 
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { display_name: 'Me' } }) }) }) 
      } as any;
      return { insert: vi.fn().mockResolvedValue({}), select: vi.fn() } as any;
    });

    render(
      <SettleUpModal 
        isOpen={true} 
        onClose={() => {}} 
        groupId="g1" 
        onSettled={onSettled} 
        memberBalances={memberBalances as any}
      />
    );

    fireEvent.change(screen.getByLabelText(/Pay To/i), { target: { value: 'u2' } });
    fireEvent.click(screen.getByLabelText(/Settle Later/i));

    const dateInput = screen.getByLabelText(/Due Date/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-31' } });

    fireEvent.click(screen.getByText(/Confirm Settlement/i));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending',
        due_date: '2026-12-31'
      }));
      expect(onSettled).toHaveBeenCalled();
    });
  });

  it('marks as completed immediately by default', async () => {
    const onSettled = vi.fn();
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'settlements') return { insert: insertMock } as any;
      if (table === 'profiles') return { 
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { display_name: 'Me' } }) }) }) 
      } as any;
      return { insert: vi.fn().mockResolvedValue({}), select: vi.fn() } as any;
    });

    render(
      <SettleUpModal 
        isOpen={true} 
        onClose={() => {}} 
        groupId="g1" 
        onSettled={onSettled} 
        memberBalances={memberBalances as any}
      />
    );

    fireEvent.change(screen.getByLabelText(/Pay To/i), { target: { value: 'u2' } });
    fireEvent.click(screen.getByText(/Confirm Settlement/i));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed'
      }));
    });
  });
});
