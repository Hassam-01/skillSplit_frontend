export interface Profile {
  id: string;
  display_name: string | null;
  phone: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  visibility: string;
  invite_token: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: string;
  category: string | null;
  is_treat: boolean;
  is_personal: boolean;
  notes: string | null;
  receipt_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profiles?: Profile;
  groups?: Group;
  expense_participants?: ExpenseParticipant[];
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
  share_percent: number | null;
  is_payer: boolean;
  profiles?: Profile;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  price: number;
  created_at: string;
  expense_item_participants?: ExpenseItemParticipant[];
}

export interface ExpenseItemParticipant {
  id: string;
  item_id: string;
  user_id: string;
  profiles?: Profile;
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  due_date: string | null;
  notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  payer?: Profile;
  payee?: Profile;
  groups?: Group;
}

export interface Dispute {
  id: string;
  expense_id: string;
  raised_by: string;
  reason: string | null;
  status: string;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  expenses?: Expense;
  profiles?: Profile;
}

export interface AuditLog {
  id: string;
  group_id: string;
  actor_id: string;
  action: string;
  target_id: string | null;
  target_type: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  groups?: Group;
  profiles?: Profile;
}

export interface OptimizedPlan {
  id: string;
  group_id: string;
  generated_at: string;
  naive_count: number | null;
  optimized_count: number | null;
  is_confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  steps?: OptimizedPlanStep[];
  groups?: Group;
}

export interface OptimizedPlanStep {
  id: string;
  plan_id: string;
  step_order: number;
  payer_id: string;
  payee_id: string;
  amount: number;
  settlement_id: string | null;
  payer?: Profile;
  payee?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

export interface EventPool {
  id: string;
  group_id: string;
  name: string;
  target_amount: number | null;
  per_member: number | null;
  status: string;
  created_by: string;
  created_at: string;
  contributions?: PoolContribution[];
}

export interface PoolContribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount: number;
  payment_method: string | null;
  contributed_at: string;
  profiles?: Profile;
}

export interface Reminder {
  id: string;
  group_id: string | null;
  sender_id: string;
  recipient_id: string;
  amount: number | null;
  message: string | null;
  channel: string | null;
  sent_at: string;
  sender?: Profile;
  recipient?: Profile;
}
