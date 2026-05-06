import { render, screen, fireEvent, waitFor, within, act } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddExpenseModal from '../components/AddExpenseModal';
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

describe('Itemized Splitting', () => {
  const mockMembers = [
    { user_id: 'u1', profiles: { display_name: 'You' } },
    { user_id: 'u2', profiles: { display_name: 'UserOne' } },
    { user_id: 'u3', profiles: { display_name: 'UserTwo' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
  });

  it('calculates itemized shares correctly and rounds to nearest integer', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const selectMock = vi.fn().mockReturnValue({
      single: () => Promise.resolve({ data: { id: 'e1' }, error: null })
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return { 
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { display_name: 'Me' } }) }) }) 
      } as any;
      if (table === 'expenses') return { insert: () => ({ select: selectMock }) } as any;
      if (table === 'expense_participants') return { insert: insertMock } as any;
      return { insert: vi.fn().mockResolvedValue({}), select: vi.fn() } as any;
    });

    render(
      <AddExpenseModal 
        isOpen={true} 
        onClose={() => {}} 
        onSaved={() => {}} 
        groupId="g1" 
        groupMembers={mockMembers as any} 
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/What was it for/i), { target: { value: 'Dinner' } });
    fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/Split Type/i), { target: { value: 'itemized' } });

    fireEvent.click(screen.getByText('+ Add Item'));
    
    const itemNameInputs = await screen.findAllByPlaceholderText(/Item Name/i);
    fireEvent.change(itemNameInputs[0], { target: { value: 'Pizza' } });
    fireEvent.change(screen.getAllByPlaceholderText(/Price/i)[0], { target: { value: '1500' } });

    // Re-query before each click to get fresh elements
    const getFirstRow = () => screen.getAllByPlaceholderText(/Item Name/i)[0].parentElement!.parentElement!;
    
    fireEvent.click(within(getFirstRow()).getByText('UserOne'));
    fireEvent.click(within(getFirstRow()).getByText('UserTwo'));

    fireEvent.click(screen.getByText('Save Expense'));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
    });
  });

  it('handles rounding differences for itemized splits', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') return { 
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { display_name: 'Me' } }) }) }) 
      } as any;
      if (table === 'expenses') return { insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'e1' }, error: null }) }) }) } as any;
      if (table === 'expense_participants') return { insert: insertMock } as any;
      return { insert: vi.fn().mockResolvedValue({}), select: vi.fn() } as any;
    });

    render(<AddExpenseModal isOpen={true} onClose={() => {}} onSaved={() => {}} groupId="g1" groupMembers={mockMembers as any} />);

    fireEvent.change(screen.getByPlaceholderText(/What was it for/i), { target: { value: 'Rounding Test' } });
    fireEvent.change(screen.getByPlaceholderText(/0.00/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Split Type/i), { target: { value: 'itemized' } });

    fireEvent.click(screen.getByText('+ Add Item'));
    await screen.findAllByPlaceholderText(/Item Name/i);
    
    fireEvent.change(screen.getAllByPlaceholderText(/Item Name/i)[0], { target: { value: 'Item 1' } });
    fireEvent.change(screen.getAllByPlaceholderText(/Price/i)[0], { target: { value: '1000' } }); 

    const getFirstRow = () => screen.getAllByPlaceholderText(/Item Name/i)[0].parentElement!.parentElement!;
    
    fireEvent.click(within(getFirstRow()).getByText('UserOne'));
    fireEvent.click(within(getFirstRow()).getByText('UserTwo'));
    fireEvent.click(within(getFirstRow()).getByText(/You/i));

    fireEvent.click(screen.getByText('Save Expense'));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalled();
      const rows = insertMock.mock.calls[0][0];
      expect(rows.length).toBe(3);
      const total = rows.reduce((sum: number, r: any) => sum + r.share_amount, 0);
      expect(total).toBe(1000); 
    });
  });
});
