import { useState } from "react";
import {
  Calendar,
  User,
  MoreVertical,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Users,
  Copy,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGroupDetail } from "../hooks/useGroupDetail";
import { useAuth } from "../contexts/AuthContext";
import AddExpenseModal from "../components/AddExpenseModal";
import SettleUpModal from "../components/SettleUpModal";
import AddMemberModal from "../components/AddMemberModal";
import { supabase } from "../utils/supabase";
import type { Expense, Profile, GroupMember } from "../types/database";
import ConfirmModal from "../components/ConfirmModal";
import SettlementVerification from "../components/SettlementVerification";
import { logAction } from "../utils/auditLog";
import GroupRightSidebar from "../components/GroupRightSidebar";
import PoolsList from "../components/PoolsList";
import CreatePoolModal from "../components/CreatePoolModal";

const CATEGORY_EMOJI: Record<string, string> = {
  dining: "🍽️",
  food: "🍽️",
  transport: "🚗",
  travel: "✈️",
  entertainment: "🎬",
  shopping: "🛍️",
  utilities: "💡",
  health: "🏥",
  sightseeing: "🏛️",
  other: "📦",
};
const getCatEmoji = (cat: string | null) =>
  CATEGORY_EMOJI[cat?.toLowerCase() ?? ""] ?? "📦";

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useGroupDetail(id);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [raiseDisputeId, setRaiseDisputeId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<
    string | null
  >(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{
    id: string;
    user_id: string;
    displayName: string;
  } | null>(null);
  const [isSettledCollapsed, setIsSettledCollapsed] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(
    null,
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'active' | 'settled' | 'pools' | 'members'>('active');


  const handleRaiseDispute = async (expenseId: string) => {
    if (!user || !disputeReason.trim()) return;
    setDisputeLoading(true);
    await supabase.from("disputes").insert({
      expense_id: expenseId,
      raised_by: user.id,
      reason: disputeReason.trim(),
    });
    setRaiseDisputeId(null);
    setDisputeReason("");
    setDisputeLoading(false);
  };

  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpenseId) return;
    await supabase
      .from("expenses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", confirmDeleteExpenseId);
    setConfirmDeleteExpenseId(null);
    refetch();
  };

  const handleToggleSettled = async (
    expenseId: string,
    currentStatus: boolean,
  ) => {
    const { error: err } = await supabase
      .from("expenses")
      .update({ is_settled: !currentStatus })
      .eq("id", expenseId);

    if (err) {
      alert(`Error: ${err.message}`);
    } else {
      await logAction({
        groupId: id!,
        actorId: user!.id,
        action: currentStatus ? "expense_unsettled" : "expense_settled",
        targetId: expenseId,
        targetType: "expense",
      });
      setRaiseDisputeId(null);
      refetch();
    }
  };

  const copyInviteToken = () => {
    if (!data?.invite_token) return;
    navigator.clipboard.writeText(data.invite_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember) return;
    const { id: memberId, user_id: userId } = confirmRemoveMember;
    const isSelf = userId === user?.id;

    try {
      const { error: rmErr } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);

      if (rmErr) throw rmErr;

      if (isSelf) {
        navigate("/groups", { replace: true });
      } else {
        refetch();
        setConfirmRemoveMember(null);
      }
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  if (loading && !data)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          color: "var(--color-on-surface-variant)",
        }}
      >
        Loading group…
      </div>
    );
  if (error)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          backgroundColor: "rgba(186,26,26,0.06)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-error)",
        }}
      >
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  if (!data) return null;

  const createdDate = new Date(data.created_at).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const isUserInvolved = (userId: string) =>
    data.expenses.some(
      (e) =>
        e.paid_by === userId ||
        e.expense_participants?.some((p) => p.user_id === userId),
    );
  const isAdmin =
    data.members.find((m) => m.user_id === user?.id)?.role === "admin";

  const activeExpenses = data.expenses.filter((e) => !e.is_settled);
  const settledExpenses = data.expenses.filter((e) => e.is_settled);
  const pendingCount = data.pendingSettlements.length;
  const memberCount = data.members.length;

  const renderExpenseItem = (expense: Expense) => {
    const myParticipant = expense.expense_participants?.find(
      (ep) => ep.user_id === user?.id,
    );
    const payerProfile = expense.profiles as Profile | null;
    const paidByMe = expense.paid_by === user?.id;
    const isMenuOpen = raiseDisputeId === expense.id;
    const isSettled = expense.is_settled;
    
    // Check dispute status
    const activeDisputes = expense.disputes?.filter((d: { status: string }) => d.status === 'open' || d.status === 'pending');
    const isDisputed = activeDisputes && activeDisputes.length > 0;

    return (
      <div
        key={expense.id}
        className={`surface-lowest ${isSettled ? "settled-expense-card" : ""} ${isMenuOpen ? "menu-open" : ""} expense-row-mobile`}
        style={{
          padding: "1.5rem",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          opacity: isDisputed ? 0.7 : 1,
        }}
      >
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: isDisputed ? "var(--color-surface-container-highest)" : "var(--color-surface-container-low)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
              filter: isDisputed ? 'grayscale(100%)' : 'none',
            }}
          >
            {getCatEmoji(expense.category)}
          </div>
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", textDecoration: isDisputed ? 'line-through' : 'none', color: isDisputed ? 'var(--color-on-surface-variant)' : 'inherit' }}>
                {expense.description}
              </h4>
              {isDisputed && (
                <span
                  className="badge-method"
                  style={{
                    backgroundColor: "var(--color-error-container)",
                    color: "var(--color-error)",
                    fontSize: "0.65rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <AlertTriangle size={10} /> Disputed
                </span>
              )}
              {isSettled && !isDisputed && (
                <span
                  className="badge-method"
                  style={{
                    backgroundColor: "var(--color-success-container)",
                    color: "var(--color-success)",
                    fontSize: "0.65rem",
                  }}
                >
                  Settled
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                color: "var(--color-on-surface-variant)",
                fontSize: "0.875rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Calendar size={14} />{" "}
                {new Date(expense.created_at).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <User size={14} />{" "}
                {paidByMe
                  ? "You paid"
                  : `${payerProfile?.display_name ?? "Someone"} paid`}
              </span>
            </div>
          </div>
        </div>

        <div
          className="expense-stats-mobile"
          style={{ display: "flex", gap: "2rem", alignItems: "center" }}
        >
          <div style={{ textAlign: "right" }}>
            <p
              className="text-label-sm"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Total
            </p>
            <p style={{ fontWeight: "700", fontSize: "1rem" }}>
              Rs. {Number(expense.amount).toLocaleString()}
            </p>
          </div>
          {myParticipant && (
            <div style={{ textAlign: "right" }}>
              <p
                className="text-label-sm"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Your Share
              </p>
              <p
                style={{
                  fontWeight: "700",
                  fontSize: "1rem",
                  color: isSettled
                    ? "var(--color-on-surface-variant)"
                    : paidByMe
                      ? "var(--color-success)"
                      : "var(--color-primary)",
                }}
              >
                Rs. {Number(myParticipant.share_amount).toLocaleString()}
              </p>
            </div>
          )}
          <div
            className="expense-actions-mobile"
            style={{ position: "relative" }}
          >
            <button
              onClick={() => setRaiseDisputeId(isMenuOpen ? null : expense.id)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-outline-variant)",
                cursor: "pointer",
                padding: "0.5rem",
              }}
            >
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "2.5rem",
                  backgroundColor: "var(--color-surface-container-lowest)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem",
                  zIndex: 10,
                  minWidth: "180px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                {(isAdmin || expense.created_by === user?.id) && (
                  <>
                    <button
                      onClick={() => handleToggleSettled(expense.id, isSettled)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        borderRadius: "var(--radius-md)",
                        color: isSettled
                          ? "var(--color-on-surface)"
                          : "var(--color-success)",
                      }}
                    >
                      {isSettled ? (
                        <Clock size={14} />
                      ) : (
                        <CheckCircle size={14} />
                      )}{" "}
                      {isSettled ? "Mark Active" : "Mark Settled"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsExpenseOpen(true);
                        setRaiseDisputeId(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Zap size={14} /> Edit Expense
                    </button>
                    <button
                      onClick={() => setConfirmDeleteExpenseId(expense.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "var(--color-error)",
                        fontSize: "0.875rem",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <Trash2 size={14} /> Delete Expense
                    </button>
                  </>
                )}
                <button
                  onClick={() => setRaiseDisputeId(`dispute-${expense.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <AlertTriangle size={14} /> Raise Dispute
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() =>
              setExpandedExpenseId(
                expandedExpenseId === expense.id ? null : expense.id,
              )
            }
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 0",
              marginTop: "0.5rem",
              borderTop: "1px solid var(--color-surface-container-high)",
              background: "none",
              borderRight: "none",
              borderBottom: "none",
              borderLeft: "none",
              cursor: "pointer",
              color: "var(--color-primary)",
              fontSize: "0.8rem",
              fontWeight: "600",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Users size={14} />
              <span>
                {expandedExpenseId === expense.id
                  ? "Hide Details"
                  : "Show Details"}
              </span>
            </div>
            {expandedExpenseId === expense.id ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          {expandedExpenseId === expense.id && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--color-surface-container-low)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              className="smooth-expand"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--color-on-surface-variant)",
                }}
              >
                <span className="text-label-sm">Breakdown</span>
                <span className="text-label-sm">Amount</span>
              </div>
              {expense.expense_participants?.map((p) => {
                const pProfile = p.profiles as unknown as Profile | null;
                const isPayer = p.user_id === expense.paid_by;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "var(--color-surface-container-high)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          color: isPayer ? "var(--color-primary)" : "inherit",
                          border: isPayer
                            ? "2px solid var(--color-primary)"
                            : "none",
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.125rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: isPayer || p.user_id === user?.id ? "600" : "400",
                          }}
                        >
                          {p.user_id === user?.id
                            ? "You"
                            : pProfile?.display_name ?? "Unknown"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: isPayer
                              ? "var(--color-primary)"
                              : "var(--color-on-surface-variant)",
                            fontWeight: isPayer ? "700" : "400",
                          }}
                        >
                          {isPayer ? "PAID FULL AMOUNT" : "OWES SHARE"}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: "700" }}>
                        Rs.{" "}
                        {Number(
                          isPayer ? expense.amount : p.share_amount,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              {expense.notes && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8rem",
                    color: "var(--color-on-surface-variant)",
                    fontStyle: "italic",
                    borderLeft: "3px solid var(--color-outline-variant)",
                  }}
                >
                  <p>“{expense.notes}”</p>
                </div>
              )}
            </div>
          )}
        </div>

        {raiseDisputeId === `dispute-${expense.id}` && (
          <div
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "1rem",
              backgroundColor: "var(--color-surface-container-low)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <input
              type="text"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue…"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                backgroundColor: "white",
                border: "1px solid var(--color-outline-variant)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                outline: "none",
                fontFamily: "var(--font-body)",
                marginBottom: "0.5rem",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn-gradient"
                style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                onClick={() => handleRaiseDispute(expense.id)}
                disabled={disputeLoading}
              >
                {disputeLoading ? "…" : "Submit"}
              </button>
              <button
                className="btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                onClick={() => setRaiseDisputeId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="group-detail-shell" style={{ position: "relative", height: "calc(100vh - 2rem)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Right Sidebar Toggle Button - Fixed on mobile/med */}
      <button
        className="btn-gradient lg-hide"
        onClick={() => setIsRightSidebarOpen(true)}
        style={{
          position: "fixed",
          right: "1.5rem",
          bottom: "1.5rem",
          zIndex: 90,
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
        title="View Balances & Members"
      >
        <Users size={24} />
      </button>

      <Link
        to="/groups"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-on-surface-variant)",
          textDecoration: "none",
          marginBottom: "0.85rem",
          fontWeight: "600",
        }}
      >
        <ArrowLeft size={20} /> Back to Groups
      </Link>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.9rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 className="text-headline-lg" style={{ margin: 0 }}>{data.name}</h2>
            {data.invite_token && (
              <button
                onClick={copyInviteToken}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid var(--color-outline-variant)',
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Copy invite link"
              >
                <Copy size={14} /> Invite {copied ? 'Copied' : 'Link'}
              </button>
            )}
          </div>
          <p
            className="text-label-sm"
            style={{ color: "var(--color-on-surface-variant)", marginTop: '0.35rem' }}
          >
            {data.members.length} Member{data.members.length !== 1 ? "s" : ""} •
            Created {createdDate}
          </p>
          {data.description && (
            <p
              style={{
                color: "var(--color-on-surface-variant)",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {data.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <button
            className="btn-gradient"
            onClick={() => setIsSettleOpen(true)}
            style={{ padding: '0.7rem 1.1rem', whiteSpace: 'nowrap' }}
          >
            Settle Up
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div className="surface-lowest" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.35rem' }}>Total spending</p>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>Rs. {data.totalSpending.toLocaleString()}</p>
        </div>
        <div className="surface-lowest" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.35rem' }}>Active expenses</p>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{activeExpenses.length}</p>
        </div>
        <div className="surface-lowest" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.35rem' }}>Members</p>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{memberCount}</p>
        </div>
        <div className="surface-lowest" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)' }}>
          <p className="text-label-sm" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '0.35rem' }}>Pending settlements</p>
          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>{pendingCount}</p>
        </div>
      </div>

      <AddExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => {
          setIsExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSaved={() => {
          setIsExpenseOpen(false);
          setEditingExpense(null);
          refetch();
        }}
        groupId={id}
        groupMembers={data.members as GroupMember[]}
        existingExpense={editingExpense || undefined}
      />
      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        onSettled={() => {
          setIsSettleOpen(false);
          refetch();
        }}
        groupId={id!}
        memberBalances={data.memberBalances}
      />
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        groupId={id!}
        onAdded={refetch}
      />
      <CreatePoolModal
        isOpen={isCreatePoolOpen}
        onClose={() => setIsCreatePoolOpen(false)}
        groupId={id!}
        onCreated={refetch}
      />

      <div className="grid-asymmetric" style={{ display: "grid", gap: "1.25rem", flex: 1, minHeight: 0, alignItems: 'stretch' }}>
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: '0.9rem' }}>
          <SettlementVerification
            settlements={data.pendingSettlements}
            onAction={refetch}
          />

          <div className="surface-lowest" style={{ padding: '0.75rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {([
                { id: 'active', label: `Active (${activeExpenses.length})` },
                { id: 'settled', label: `Settled (${settledExpenses.length})` },
                { id: 'members', label: `Members (${memberCount})` },
                { id: 'pools', label: 'Event Pools' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '999px',
                    padding: '0.7rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    backgroundColor: detailTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: detailTab === tab.id ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="surface-low" style={{ padding: '1.1rem', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid var(--color-surface-container-high)' }}>
              {detailTab === 'active' && (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
                    <div>
                      <h3 className="text-title-lg">Active Expenses</h3>
                      <p className="text-body-lg" style={{ fontSize: '0.82rem' }}>A clean, focused list of items still in motion.</p>
                    </div>
                    <button className="btn-gradient" style={{ padding: '0.5rem 1.1rem', whiteSpace: 'nowrap' }} onClick={() => setIsExpenseOpen(true)}>
                      Add New
                    </button>
                  </div>

                  {activeExpenses.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-on-surface-variant)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-lg)', minHeight: '220px' }}>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No active expenses</p>
                        <p style={{ fontSize: '0.9rem' }}>Everything is currently settled or no expenses added yet.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: 0, maxHeight: '100%', overflowY: 'auto', paddingRight: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {activeExpenses.map(renderExpenseItem)}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'settled' && (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
                    <div>
                      <h3 className="text-title-lg">Settled Expenses</h3>
                      <p className="text-body-lg" style={{ fontSize: '0.82rem' }}>Historical items kept compact.</p>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1.1rem' }} onClick={() => setIsSettledCollapsed(!isSettledCollapsed)}>
                      {isSettledCollapsed ? 'Show list' : 'Collapse'}
                    </button>
                  </div>

                  {settledExpenses.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-on-surface-variant)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-lg)', minHeight: '220px' }}>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No settled expenses yet</p>
                        <p style={{ fontSize: '0.9rem' }}>Settled items will appear here after verification.</p>
                      </div>
                    </div>
                  ) : isSettledCollapsed ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-on-surface-variant)', backgroundColor: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-lg)', minHeight: '280px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{settledExpenses.length} settled expenses hidden</p>
                        <p style={{ fontSize: '0.9rem' }}>Open the list to review historical items.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {settledExpenses.map(renderExpenseItem)}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
                    <div>
                      <h3 className="text-title-lg">Members</h3>
                      <p className="text-body-lg" style={{ fontSize: '0.82rem' }}>Everyone in the group with a compact status view.</p>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1.1rem' }} onClick={() => setIsAddMemberOpen(true)}>
                      + Add Member
                    </button>
                  </div>

                    <div style={{ flex: 1, minHeight: 0, maxHeight: '100%', overflowY: 'auto', paddingRight: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.members.map((member) => {
                      const profile = member.profiles as unknown as Profile | null;
                      const isCurrentUser = member.user_id === user?.id;
                      return (
                        <div key={member.id} className="surface-lowest" style={{ padding: '0.95rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                              {(profile?.display_name ?? '?')[0]}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700 }}>{profile?.display_name ?? 'Unknown'}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{member.role}{isCurrentUser ? ' • you' : ''}</p>
                            </div>
                          </div>
                          {isAdmin && !isCurrentUser && (
                            <button
                              onClick={() => onRemoveMember({ id: member.id, user_id: member.user_id, displayName: profile?.display_name ?? 'Unknown' })}
                              style={{ background: 'none', border: 'none', color: 'var(--color-outline-variant)', cursor: 'pointer' }}
                              title="Remove member"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailTab === 'pools' && (
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem' }}>
                    <div>
                      <h3 className="text-title-lg">Event Pools</h3>
                      <p className="text-body-lg" style={{ fontSize: '0.82rem' }}>A focused space for pooled goals and contributions.</p>
                    </div>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }} onClick={() => setIsCreatePoolOpen(true)}>
                      + New Pool
                    </button>
                  </div>

                  <div style={{ flex: 1, minHeight: 0, maxHeight: '100%', overflowY: 'auto', paddingRight: '0.4rem' }}>
                    <PoolsList groupId={id!} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <GroupRightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          data={data}
          user={user}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .group-detail-shell {
            height: auto !important;
            overflow: visible !important;
          }
        }
        @media (max-width: 600px) {
          .group-detail-shell {
            min-height: calc(100vh - 1rem);
          }
          .group-detail-shell > div[style*="grid-template-columns: repeat(4, minmax(0, 1fr))"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}} />

      <ConfirmModal
        isOpen={!!confirmDeleteExpenseId}
        onClose={() => setConfirmDeleteExpenseId(null)}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action can be undone by an administrator if needed."
        confirmText="Delete"
        type="danger"
      />

      <ConfirmModal
        isOpen={!!confirmRemoveMember}
        onClose={() => setConfirmRemoveMember(null)}
        onConfirm={handleRemoveMember}
        title={
          confirmRemoveMember?.user_id === user?.id
            ? "Leave Group"
            : "Remove Member"
        }
        message={
          confirmRemoveMember?.user_id === user?.id
            ? "Are you sure you want to leave this group?"
            : `Are you sure you want to remove ${confirmRemoveMember?.displayName} from the group?`
        }
        confirmText={
          confirmRemoveMember?.user_id === user?.id ? "Leave" : "Remove"
        }
        type="danger"
      />
    </div>
  );
};

export default GroupDetail;
