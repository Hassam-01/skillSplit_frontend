# SkillSplit Test Coverage and Documentation

This document provides a detailed overview of the test cases, coverage metrics, and the architecture of the SkillSplit testing suite.

## Test Infrastructure
- **Framework:** Vitest
- **UI Testing:** React Testing Library
- **Mocks:** Custom Supabase and AuthContext mocks
- **Environment:** JSDOM

## Test Case Matrix

### UI Components

| Component | Test Scenarios | Coverage |
| :--- | :--- | :--- |
| **Sidebar** | - Rendering for auth users<br>- Logout confirmation flow | High |
| **AddMemberModal** | - User search functionality<br>- Error handling for existing members | High |
| **SettleUpModal** | - Empty state handling<br>- Participant selection<br>- Settlement submission | High |
| **AddExpenseModal** | - Multi-participant selection<br>- Share calculation (Equal Split) | Medium |
| **CreateGroupModal** | - Group creation form<br>- Validation logic | Medium |

### Pages

| Page | Test Scenarios | Coverage |
| :--- | :--- | :--- |
| **Dashboard** | - Loading states<br>- Statistics calculation<br>- Recent activity display | High |
| **GroupDetail** | - Group metadata rendering<br>- Expense list display<br>- Balance summary | High |

### Logic Hooks

| Hook | Test Scenarios | Coverage |
| :--- | :--- | :--- |
| **useGroupDetail** | - Settlement verification logic<br>- Data fetching and state sync | High |
| **useOptimization** | - Debt simplification algorithm accuracy | Full |
| **useExpenses** | - CRUD operations for expenses | High |
| **useGroups** | - Group list fetching and filtering | High |

## Test Execution Summary (Current)

```mermaid
graph TD
    A[Total Tests: 32] --> B[Passed: 32]
    A --> C[Failed: 0]
    B --> D[Components: 16]
    B --> E[Hooks: 10]
    B --> F[Utils: 6]
```

## Performance Metrics
- **Average Suite Duration:** ~15s
- **Transformation Time:** ~7s
- **Setup Overhead:** ~18s

## Maintenance Guide
1. **Adding New Tests:** Use `src/test/test-utils.tsx` for components requiring context providers.
2. **Mocking Supabase:** All Supabase interactions should be mocked via `src/test/test-utils.tsx` or locally using `vi.mocked(supabase.from)`.
3. **Selector Best Practices:** Use `aria-label` where possible to decouple tests from visual styling and text changes.
