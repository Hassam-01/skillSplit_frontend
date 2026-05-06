import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddMemberModal from '../components/AddMemberModal';
import { supabase } from '../utils/supabase';

vi.mock('../utils/supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

describe('AddMemberModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches for users and displays results', async () => {
    const orMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({
      data: [{ id: 'u2', display_name: 'New User', phone: '123456' }],
      error: null
    });
    
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({ or: orMock, limit: limitMock })
    } as any);

    render(<AddMemberModal isOpen={true} onClose={() => {}} groupId="g1" onAdded={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by phone or name/i);
    fireEvent.change(input, { target: { value: 'New' } });
    
    fireEvent.click(screen.getByLabelText('Search'));

    await waitFor(() => {
      expect(screen.getByText('New User')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
    });
  });

  it('adds a member successfully', async () => {
    const onAdded = vi.fn();
    
    // Search mock
    const limitMock = vi.fn().mockResolvedValue({
      data: [{ id: 'u2', display_name: 'New User', phone: '123456' }],
      error: null
    });
    
    // Group members check and insert mocks
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: null }); // Not already a member
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') return { select: () => ({ or: () => ({ limit: limitMock }) }) } as any;
        if (table === 'group_members') return { 
            select: () => ({ eq: () => ({ eq: () => ({ single: singleMock }) }) }),
            insert: insertMock
        } as any;
        return {} as any;
    });

    render(<AddMemberModal isOpen={true} onClose={() => {}} groupId="g1" onAdded={onAdded} />);

    // Trigger search
    const input = screen.getByPlaceholderText(/Search by phone or name/i);
    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.click(screen.getByLabelText('Search'));
    
    await waitFor(() => screen.getByText('New User'));

    // Click Add
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({ group_id: 'g1', user_id: 'u2', role: 'member' });
      expect(onAdded).toHaveBeenCalled();
    });
  });

  it('shows error if user is already a member', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null }); // Already a member

    vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') return { select: () => ({ or: () => ({ limit: vi.fn().mockResolvedValue({ data: [{ id: 'u2' }], error: null }) }) }) } as any;
        if (table === 'group_members') return { 
            select: () => ({ eq: () => ({ eq: () => ({ single: singleMock }) }) }),
        } as any;
        return {} as any;
    });

    render(<AddMemberModal isOpen={true} onClose={() => {}} groupId="g1" onAdded={() => {}} />);

    const input = screen.getByPlaceholderText(/Search by phone or name/i);
    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.click(screen.getByLabelText('Search'));
    
    await waitFor(() => screen.getByText('Add'));
    fireEvent.click(screen.getByText('Add'));

    expect(await screen.findByText('User is already a member of this group.')).toBeInTheDocument();
  });
});
