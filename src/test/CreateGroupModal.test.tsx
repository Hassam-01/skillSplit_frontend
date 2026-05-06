import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateGroupModal from '../components/CreateGroupModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { logAction } from '../utils/auditLog';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/auditLog', () => ({
  logAction: vi.fn(),
}));

vi.mock('../utils/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
    }
  };
});

describe('CreateGroupModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
  });

  it('does not render when isOpen is false', () => {
    render(<CreateGroupModal isOpen={false} onClose={() => {}} onCreated={() => {}} />);
    expect(screen.queryByText('Create New Group')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
    render(<CreateGroupModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    expect(screen.getByText('Create New Group')).toBeInTheDocument();
  });

  it('submits the form correctly', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
    
    const mockInsert = vi.fn().mockImplementation((data) => {
       if(data.role === 'admin') {
           // second call to group_members
           return Promise.resolve({ error: null });
       }
       return {
         select: () => ({
           single: () => Promise.resolve({ data: { id: 'g1', name: 'New Group' }, error: null })
         })
       }
    });
    
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: mockInsert
    }) as any);

    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(<CreateGroupModal isOpen={true} onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Lahore Trip'), { target: { value: 'New Group' } });
    fireEvent.click(screen.getByText('Create Group'));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
    
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      action: 'created_group',
      groupId: 'g1'
    }));
  });
});
