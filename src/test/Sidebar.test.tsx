import { render, screen } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../utils/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ count: 5 }))
          }))
        }))
      }))
    }
  };
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for authenticated user', async () => {
    const mockSignOut = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      profile: { display_name: 'Test User' },
      signOut: mockSignOut,
    } as any);

    render(<Sidebar />);

    expect(screen.getByText('SkillSplit')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Check unread count is displayed
    expect(await screen.findByText('5')).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    const mockSignOut = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      profile: null,
      signOut: mockSignOut,
    } as any);

    render(<Sidebar />);
    
    const logoutBtn = screen.getByText('Logout');
    logoutBtn.click();
    
    expect(mockSignOut).toHaveBeenCalled();
  });
});
