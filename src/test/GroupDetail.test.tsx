import { render, screen, fireEvent } from './test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupDetail from '../pages/GroupDetail';
import { useAuth } from '../contexts/AuthContext';
import { useGroupDetail } from '../hooks/useGroupDetail';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useGroupDetail', () => ({
  useGroupDetail: vi.fn(),
}));

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: 'g1' }),
    };
});

describe('GroupDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
    vi.mocked(useGroupDetail).mockReturnValue({ loading: true, data: null, error: null, refetch: vi.fn() } as any);

    render(<GroupDetail />);
    expect(screen.getByText('Loading group…')).toBeInTheDocument();
  });

  it('renders group data, expenses and balances', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
    vi.mocked(useGroupDetail).mockReturnValue({
      loading: false,
      data: {
        id: 'g1',
        name: 'Europe Trip',
        totalSpending: 1000,
        members: [{ id: 'm1', user_id: 'u1', profiles: { display_name: 'Me' } }],
        expenses: [
          {
            id: 'e1',
            description: 'Train tickets',
            amount: 200,
            category: 'transport',
            created_at: new Date().toISOString(),
            paid_by: 'u1',
            profiles: { display_name: 'Me' },
            expense_participants: [{ user_id: 'u1', share_amount: 100 }]
          }
        ],
        memberBalances: [
          { userId: 'u2', displayName: 'Friend', netBalance: 150 }
        ],
        invite_token: 'INV123',
        created_at: new Date().toISOString(),
        pendingSettlements: [],
        allSettlements: [],
      },
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<GroupDetail />);

    expect(screen.getByRole('heading', { name: /Europe Trip/i })).toBeInTheDocument();
    expect(screen.getByText('Rs. 1,000')).toBeInTheDocument();
    
    // Check expense
    expect(screen.getByText('Train tickets')).toBeInTheDocument();
    expect(screen.getByText('Rs. 200')).toBeInTheDocument();

    // Check balance
    expect(screen.getByText('Friend')).toBeInTheDocument();
    expect(screen.getByText(/Owes you/)).toBeInTheDocument();
    expect(screen.getByText('Rs. 150')).toBeInTheDocument();
  });

  it('opens Add Expense modal on click', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1' } } as any);
    vi.mocked(useGroupDetail).mockReturnValue({
      loading: false,
      data: { id: 'g1', name: 'G', members: [], expenses: [], memberBalances: [], totalSpending: 0, created_at: new Date().toISOString(), pendingSettlements: [], allSettlements: [] },
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<GroupDetail />);
    
    fireEvent.click(screen.getByText('Add New'));
    
    // The modal has an H2 with "Add Expense"
    expect(await screen.findByRole('heading', { name: /Add Expense/i })).toBeInTheDocument();
  });
});
