import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettleUpModal from '../components/SettleUpModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { logAction } from '../utils/auditLog';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/auditLog', () => ({
  logAction: vi.fn(),
}));

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('SettleUpModal Component', () => {
  const mockBalances = [
    { userId: 'u2', displayName: 'Friend', netBalance: -150 } // You owe Friend 150
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('shows empty state when no one is owed', () => {
    render(<SettleUpModal isOpen={true} onClose={() => {}} onSettled={() => {}} groupId="g1" memberBalances={[]} />);
    expect(screen.getByText(/You don't owe anyone/i)).toBeInTheDocument();
  });

  it('renders list of people you owe', () => {
    render(<SettleUpModal isOpen={true} onClose={() => {}} onSettled={() => {}} groupId="g1" memberBalances={mockBalances} />);
    expect(screen.getByText(/Friend — Rs. 150/i)).toBeInTheDocument();
  });

  it('sets amount automatically when member is selected', async () => {
    render(<SettleUpModal isOpen={true} onClose={() => {}} onSettled={() => {}} groupId="g1" memberBalances={mockBalances} />);
    
    const select = screen.getByDisplayValue(/Select member/i);
    fireEvent.change(select, { target: { value: 'u2' } });

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(amountInput.value).toBe('150.00');
  });

  it('submits settlement correctly', async () => {
    const onSettled = vi.fn();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'settlements') return { insert: insertMock } as any;
      if (table === 'profiles') return { 
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { display_name: 'Me' } }) }) }) 
      } as any;
      return { insert: vi.fn(), select: vi.fn() } as any;
    });

    render(<SettleUpModal isOpen={true} onClose={() => {}} onSettled={onSettled} groupId="g1" memberBalances={mockBalances} />);

    const select = screen.getByDisplayValue(/Select member/i);
    fireEvent.change(select, { target: { value: 'u2' } });
    fireEvent.click(screen.getByText('Confirm Settlement'));

    await waitFor(() => {
      expect(onSettled).toHaveBeenCalled();
    });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      payer_id: 'u1',
      payee_id: 'u2',
      amount: 150,
      status: 'pending'
    }));
    
    expect(logAction).toHaveBeenCalled();
  });
});
