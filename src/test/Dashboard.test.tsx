import { render, screen } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useExpenses } from '../hooks/useExpenses';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useExpenses', () => ({
  useExpenses: vi.fn(),
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with loading state', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' }, profile: { display_name: 'Test User' } } as any);
    vi.mocked(useExpenses).mockReturnValue({
      recentExpenses: [],
      stats: { totalBalance: 0, youAreOwed: 0, youOwe: 0, groupCount: 0, pendingSettlementsCount: 0, openDisputesCount: 0 },
      loading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<Dashboard />);
    expect(screen.getByText('Hey, Test!')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders stats and recent expenses correctly', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' }, profile: { display_name: 'Test User' } } as any);
    vi.mocked(useExpenses).mockReturnValue({
      recentExpenses: [
        {
          id: 'exp1',
          description: 'Dinner',
          amount: 100,
          category: 'dining',
          paid_by: 'u1',
          created_at: new Date().toISOString(),
          expense_participants: [{ user_id: 'u1', share_amount: 50 }],
          groups: { name: 'Food Group' },
          profiles: { display_name: 'Test User' }
        }
      ],
      stats: { totalBalance: 50, youAreOwed: 50, youOwe: 0, groupCount: 1, pendingSettlementsCount: 1, openDisputesCount: 0 },
      loading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<Dashboard />);

    // Assert Quick Summary
    expect(screen.getByText('You have 1 pending settlement.')).toBeInTheDocument();
    
    // Assert Stats
    expect(screen.getAllByText('Rs. 50').length).toBeGreaterThanOrEqual(1); // Net Balance and You are owed
    
    // Assert Recent Expenses
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText(/Food Group/)).toBeInTheDocument();
  });
});
