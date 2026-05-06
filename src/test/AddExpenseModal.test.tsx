import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddExpenseModal from '../components/AddExpenseModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

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

describe('AddExpenseModal Component', () => {
  const mockMembers = [
    { user_id: 'u1', profiles: { display_name: 'User 1' } },
    { user_id: 'u2', profiles: { display_name: 'User 2' } }
  ] as any;

  // Define shared mocks
  const mockExpensesInsert = vi.fn();
  const mockParticipantsInsert = vi.fn();
  const mockNotificationsInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' }, profile: { display_name: 'User 1' } } as any);

    mockExpensesInsert.mockReturnValue({
        select: () => ({
            single: () => Promise.resolve({ data: { id: 'exp1' }, error: null })
        })
    });
    mockParticipantsInsert.mockResolvedValue({ error: null });
    mockNotificationsInsert.mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'expenses') return { insert: mockExpensesInsert } as any;
        if (table === 'expense_participants') return { insert: mockParticipantsInsert } as any;
        if (table === 'notifications') return { insert: mockNotificationsInsert } as any;
        return { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() } as any;
    });
  });

  it('renders correctly and shows participants', () => {
    render(<AddExpenseModal isOpen={true} onClose={() => {}} onSaved={() => {}} groupId="g1" groupMembers={mockMembers} />);
    expect(screen.getByText('Add Expense')).toBeInTheDocument();
    // Use getAllByText because it appears in dropdown and pills
    expect(screen.getAllByText('User 2').length).toBeGreaterThan(0);
  });

  it('submits form with correct shares (equal split)', async () => {
    const onSaved = vi.fn();
    
    render(<AddExpenseModal isOpen={true} onClose={() => {}} onSaved={onSaved} groupId="g1" groupMembers={mockMembers} />);

    fireEvent.change(screen.getByPlaceholderText('What was it for?'), { target: { value: 'Lunch' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });

    const user2Participants = screen.getAllByText('User 2');
    fireEvent.click(user2Participants[1]); // Toggle User 2 to selected

    fireEvent.click(screen.getByText('Save Expense'));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(mockExpensesInsert).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Lunch',
      amount: 100,
    }));

    expect(mockParticipantsInsert).toHaveBeenCalledWith([
      { expense_id: 'exp1', user_id: 'u1', share_amount: 50, is_payer: true },
      { expense_id: 'exp1', user_id: 'u2', share_amount: 50, is_payer: false }
    ]);
  });

  it('shows error if no participants selected', async () => {
      render(<AddExpenseModal isOpen={true} onClose={() => {}} onSaved={() => {}} groupId="g1" groupMembers={mockMembers} />);
      
      const youParticipants = screen.getAllByText('You');
      fireEvent.click(youParticipants[1]); // Deselect 'You' participant pill
      
      fireEvent.change(screen.getByPlaceholderText('What was it for?'), { target: { value: 'Lunch' } });
      fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '100' } });
      fireEvent.click(screen.getByText('Save Expense'));
      
      expect(await screen.findByText('Select at least one participant.')).toBeInTheDocument();
  });
});
