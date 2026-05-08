# SkillSplit Feature Test Coverage

This document maps application features to their corresponding automated tests to ensure full functional coverage.

## 1. Financial Features

### Expense Management
- **Equal Splitting**: Covered in `AddExpenseModal.test.tsx` -> *submits form with correct shares (equal split)*
- **Itemized Splitting**: Covered in `ItemizedSplit.test.tsx` -> *calculates itemized shares correctly*
- **Rounding Logic**: Covered in `ItemizedSplit.test.tsx` -> *handles rounding differences for itemized splits*
- **Validation**: Covered in `AddExpenseModal.test.tsx` -> *shows error if no participants selected*

### Settlement System
- **Instant Settlement**: Covered in `SettleUpModal.test.tsx` -> *submits settlement correctly*
- **Settle Later (Scheduling)**: Covered in `SettleLater.test.tsx` -> *allows scheduling a settlement for later*
- **Balance Calculation**: Covered in `useGroupDetail.test.ts` -> *should fetch group details and calculate member balances correctly*
- **Settlement Impact**: Covered in `useGroupDetail.test.ts` -> *should factor confirmed settlements into balances*

### Debt Optimization
- **Simplify Debts**: Covered in `useOptimization.test.ts` -> *should simplify debts correctly and generate a plan*

### Event Pools
- **Target Total Pools**: Covered in `EventPools.test.tsx` -> *allows creating a central pool with a target amount*
- **Per-Member Pools**: Covered in `EventPools.test.tsx` -> *displays contributions correctly in the pool list*

---

## 2. Group & User Management

### Membership
- **Add Member**: Covered in `AddMemberModal.test.tsx` -> *adds a member successfully*
- **Member Search**: Covered in `AddMemberModal.test.tsx` -> *searches for users and displays results*
- **Duplicate Prevention**: Covered in `AddMemberModal.test.tsx` -> *shows error if user is already a member*

### Group Lifecycle
- **Group Creation**: Covered in `CreateGroupModal.test.tsx` -> *submits the form correctly*
- **Dashboard Overview**: Covered in `Dashboard.test.tsx` -> *renders stats and recent expenses correctly*
- **Group Detail View**: Covered in `GroupDetail.test.tsx` -> *renders group data, expenses and balances*

---

## 3. Transparency & Disputes

### Audit Trail
- **Action Logging**: Covered in `auditLog.test.ts` -> *should call supabase.from("audit_log").insert*
- **Activity Log View**: Covered in `useActivityLog.test.ts` -> *should fetch and group activity logs by day*

### Dispute System
- **Dispute Retrieval**: Covered in `useDisputes.test.ts` -> *should fetch and format disputes correctly*
- **Dispute Resolution**: Covered in `useDisputes.test.ts` -> *should resolve a dispute correctly*

---

## 4. User Experience & Navigation

### Authentication & UI
- **Profile Display**: Covered in `Sidebar.test.tsx` -> *renders correctly for authenticated user*
- **Logout**: Covered in `Sidebar.test.tsx` -> *calls signOut when logout is clicked and confirmed*
- **Loading States**: Covered in `Dashboard.test.tsx` & `GroupDetail.test.tsx` (Loading state tests)
