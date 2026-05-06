import { render, screen, fireEvent, waitFor } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1200;
    window.dispatchEvent(new Event('resize'));
  });

  it('renders correctly for authenticated user', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      profile: { display_name: 'Test User' },
      signOut: vi.fn(),
    } as any);

    render(<Sidebar isOpen={true} />);
    
    expect(screen.getByText('SkillSplit')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked and confirmed', async () => {
    const mockSignOut = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      profile: null,
      signOut: mockSignOut,
    } as any);

    render(<Sidebar isOpen={true} />);
    
    // Click the logout button in the sidebar
    // We use getAllByText because there might be other "Logout" texts later, 
    // but initially there's only one in the sidebar.
    const logoutBtn = screen.getByLabelText('Sidebar Logout');
    fireEvent.click(logoutBtn);
    
    // Modal should appear
    const confirmBtn = await screen.findByRole('button', { name: 'Logout' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
