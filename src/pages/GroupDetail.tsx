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
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
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
        window.location.href = "/groups";
      } else {
        refetch();
        setConfirmRemoveMember(null);
      }
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  if (loading)
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
    <div style={{ position: "relative" }}>
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
          marginBottom: "2rem",
          fontWeight: "600",
        }}
      >
        <ArrowLeft size={20} /> Back to Groups
      </Link>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 className="text-headline-lg">{data.name}</h2>
          <p
            className="text-label-sm"
            style={{ color: "var(--color-on-surface-variant)" }}
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
        <div style={{ textAlign: "right" }}>
          <p
            className="text-label-sm"
            style={{
              color: "var(--color-on-surface-variant)",
              marginBottom: "0.125rem",
            }}
          >
            Total Spending
          </p>
          <h3 style={{ fontSize: "1.5rem", color: "var(--color-primary)" }}>
            Rs. {data.totalSpending.toLocaleString()}
          </h3>
        </div>
      </header>

      <AddExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSaved={() => {
          setIsExpenseOpen(false);
          refetch();
        }}
        groupId={id}
        groupMembers={data.members as GroupMember[]}
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

      <div className="grid-asymmetric" style={{ display: "grid", gap: "3rem" }}>
        <section>
          <SettlementVerification
            settlements={data.pendingSettlements}
            onAction={refetch}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h3 className="text-title-lg">Active Expenses</h3>
            <button
              className="btn-gradient"
              style={{ padding: "0.5rem 1.5rem" }}
              onClick={() => setIsExpenseOpen(true)}
            >
              Add New
            </button>
          </div>

          {activeExpenses.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: "var(--color-on-surface-variant)",
                backgroundColor: "var(--color-surface-container-low)",
                borderRadius: "var(--radius-md)",
                marginBottom: "2rem",
              }}
            >
              <p style={{ fontWeight: "600" }}>No active expenses</p>
              <p style={{ fontSize: "0.9rem" }}>
                Everything is currently settled or no expenses added yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginBottom: "3rem",
              }}
            >
              {activeExpenses.map(renderExpenseItem)}
            </div>
          )}

          {settledExpenses.length > 0 && (
            <div>
              <div
                onClick={() => setIsSettledCollapsed(!isSettledCollapsed)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--color-surface-container-high)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                <h3
                  className="text-title-md"
                  style={{
                    color: "var(--color-on-surface-variant)",
                    margin: 0,
                  }}
                >
                  Settled Expenses ({settledExpenses.length})
                </h3>
                {isSettledCollapsed ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
              </div>
              {!isSettledCollapsed && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                  }}
                >
                  {settledExpenses.map(renderExpenseItem)}
                </div>
              )}
            </div>
          )}
        </section>

        <GroupRightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          data={data}
          user={user}
          isAdmin={isAdmin}
          isUserInvolved={isUserInvolved}
          onSettleUp={() => setIsSettleOpen(true)}
          onAddMember={() => setIsAddMemberOpen(true)}
          onRemoveMember={setConfirmRemoveMember}
          copyInviteToken={copyInviteToken}
          copied={copied}
        />
      </div>

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
