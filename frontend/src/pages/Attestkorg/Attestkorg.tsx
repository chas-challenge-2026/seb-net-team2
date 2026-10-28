import { translateSystemText } from "../../i18n/translateSystemText";
import { RequiredMark } from "../../components/FormValidation/RequiredField";
import { focusField } from "../../components/FormValidation/useFormValidation";
import { useModalFocus } from "../../hooks/useModalFocus";
import { FieldError } from "../../components/FormValidation/FormErrors";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    ArrowRight,
    ChevronDown,
    CircleCheck,
    CircleX,
    ClipboardCheck,
    Info,
} from "lucide-react";

import { APPROVALS_QUERY_KEY, useApprovals } from "../../hooks/useApprovals";
import { decideApproval } from "../../services/approvalService";
import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { AppError } from "../../errors/AppError";
import { daysWaiting, isOverdue } from "../../utils/approvalReminders";
import { formatIban, recipientBank } from "../../utils/paymentChecks";
import { useAuth } from "../../hooks/useAuth";

import { PaymentChecks } from "./PaymentChecks";
import { PaymentSourceAccount } from "./PaymentSourceAccount";
import { DueBadge, RecipientAndDueRows } from "./PaymentDueInfo";
import { ApprovalTabs } from "./ApprovalTabs";
import { TAB_IDS, type ApprovalTab } from "./approvalTabIds";
import { HandledApprovals } from "./HandledApprovals";
import { ApprovalListSkeleton } from "./ApprovalListSkeleton";
import { BulkApproveDialog, type BulkApproveResult } from "./BulkApproveDialog";
import { formatAmount, formatTotals } from "./approvalFormat";
import {
    APPROVAL_HISTORY_QUERY_KEY,
    isHistoryUnavailable,
} from "../../hooks/useApprovalHistory";
import { useHandledHistory } from "../../hooks/useAdminDecisionHistory";
import { addSessionDecision, useSessionDecisions } from "../../hooks/useSessionDecisions";
import styles from "./Attestkorg.module.css";

const COMMENT_MAX_LENGTH = 300;
const REJECT_REASON_MIN_LENGTH = 10;

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_LABEL_KEYS: Record<SortOption, string> = {
    "date-desc": "approvalInbox.sort.newest",
    "date-asc": "approvalInbox.sort.oldest",
    "amount-desc": "approvalInbox.sort.amountHigh",
    "amount-asc": "approvalInbox.sort.amountLow",
};

type ConfirmAction = {
    approval: PendingApprovalStep;
    kind: "approve" | "reject";
};

type ActionFeedback = {
    type: "approved" | "rejected" | "info";
    message: string;
};

function sortApprovals(approvals: PendingApprovalStep[], sortOption: SortOption): PendingApprovalStep[] {
    return [...approvals].sort((a, b) => {
        switch (sortOption) {
            case "date-asc":
                return new Date(a.paymentCreatedAt).getTime() - new Date(b.paymentCreatedAt).getTime();
            case "date-desc":
                return new Date(b.paymentCreatedAt).getTime() - new Date(a.paymentCreatedAt).getTime();
            case "amount-asc":
                return a.amount - b.amount;
            case "amount-desc":
                return b.amount - a.amount;
        }
    });
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof AppError) return translateSystemText(error.detail ?? error.message);
    return fallback;
}

export function Attestkorg() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ApprovalTab>("pending");

    // Number shown on the "Handled" tab: the real history when the backend has it,
    // otherwise this session's decisions.
    const historyQuery = useHandledHistory(user);
    const sessionDecisions = useSessionDecisions(user?.id);
    const handledCount = historyQuery.isError && isHistoryUnavailable(historyQuery.error)
        ? sessionDecisions.length
        : historyQuery.data?.length ?? 0;
    const { data: approvals = [], isPending, isError, error } = useApprovals();
    const queryClient = useQueryClient();

    // Oldest first: the payments that have waited longest are the most urgent for an attestant.
    const [pendingSort, setPendingSort] = useState<SortOption>("date-asc");
    // Empty until the user changes the order, so nothing is announced when the page loads.
    const [sortAnnouncement, setSortAnnouncement] = useState("");
    const [comments, setComments] = useState<Record<string, string>>({});
    // Cards start compact; the attestant opens the details (IBAN, account, time) when needed.
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
    // Payments ticked for "Approve selected". Steps that leave the list drop out on their own,
    // because only the ticked steps that are still pending are used.
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [bulkOpen, setBulkOpen] = useState(false);

    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [reasonError, setReasonError] = useState(false);
    const reasonRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    useModalFocus(confirmAction !== null, modalRef, false);
    const feedbackRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const decisionMutation = useMutation({
        mutationFn: decideApproval,
    });

    const sortedApprovals = sortApprovals(approvals, pendingSort).sort(
        (a, b) => Number(isOverdue(b)) - Number(isOverdue(a))
    );

    // Count all steps, but include each payment's amount only once.
    const pendingPayments = [...new Map(approvals.map((approval) => [approval.paymentId, approval])).values()];
    const pendingTotal = formatTotals(pendingPayments, locale);

    const selectedApprovals = sortedApprovals.filter((approval) => selectedIds.has(approval.stepId));
    const allSelected = sortedApprovals.length > 0 && selectedApprovals.length === sortedApprovals.length;
    const someSelected = selectedApprovals.length > 0 && !allSelected;
    const selectAllRef = useRef<HTMLInputElement>(null);

    // "Some selected" has no HTML attribute, only the indeterminate property.
    useEffect(() => {
        if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
    }, [someSelected]);

    const confirmComment = confirmAction
        ? (comments[confirmAction.approval.stepId] ?? "").trim()
        : "";

    const isRejectReasonMissing =
        confirmAction?.kind === "reject" &&
        confirmComment.length < REJECT_REASON_MIN_LENGTH;

    function closeConfirm() {
        if (decisionMutation.isPending) return;
        setConfirmAction(null);
        triggerRef.current?.focus();
    }

    // The link that was clicked disappears with the tab switch, so focus is moved to the
    // "Handled" tab instead of falling back to the top of the page.
    function showHandledTab() {
        setActiveTab("handled");
        requestAnimationFrame(() => document.getElementById(TAB_IDS.handled.tab)?.focus());
    }

    // How long the payment has waited, with the date, so neither has to be looked up:
    // "Sent today 09:12", "Waiting 2 days (26 Oct)", or only "Sent 25 Oct" when the red
    // "Waiting 3 days" badge already says how long.
    function sentLabel(approval: PendingApprovalStep): string {
        const sent = new Date(approval.paymentCreatedAt);
        const date = sent.toLocaleDateString(locale, { day: "numeric", month: "short" });
        const time = sent.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        const days = daysWaiting(approval);

        if (isOverdue(approval)) return t("approvalInbox.card.sentOn", { date });
        // Under 24 hours, but possibly yesterday evening: "today" only on the same date.
        if (days === 0) {
            return sent.toDateString() === new Date().toDateString()
                ? `${t("approvalInbox.card.waitingToday")} ${time}`
                : t("approvalInbox.card.sentOn", { date: `${date} ${time}` });
        }
        return `${t("approvalInbox.card.waitingDays", { count: days })} (${date})`;
    }

    function toggleDetails(stepId: string) {
        setExpandedIds((current) => {
            const updated = new Set(current);
            if (!updated.delete(stepId)) updated.add(stepId);
            return updated;
        });
    }

    function toggleSelected(stepId: string) {
        setSelectedIds((current) => {
            const updated = new Set(current);
            if (!updated.delete(stepId)) updated.add(stepId);
            return updated;
        });
    }

    function toggleSelectAll() {
        setSelectedIds(allSelected
            ? new Set()
            : new Set(sortedApprovals.map((approval) => approval.stepId)));
    }

    async function handleBulkDone({ approved, failed, comment }: BulkApproveResult) {
        const decidedAt = new Date().toISOString();

        // Shown in the "Handled" tab until the backend provides the real history.
        for (const approval of approved) {
            addSessionDecision(queryClient, user?.id, {
                stepId: approval.stepId,
                stepNumber: approval.stepNumber,
                paymentId: approval.paymentId,
                reference: approval.reference,
                amount: approval.amount,
                currency: approval.currency,
                toIban: approval.toIban,
                recipientName: approval.recipientName,
                createdByUserName: approval.createdByUserName,
                decision: "approved",
                comment: comment || null,
                decidedAt,
            });
        }

        const failedMessage = failed.length > 0
            ? t("approvalInbox.bulk.failed", {
                references: failed.map((approval) => approval.reference).join(", "),
            })
            : "";

        setActionFeedback(approved.length > 0
            ? {
                type: "approved",
                message: [
                    t("approvalInbox.bulk.approved", {
                        count: approved.length,
                        total: formatTotals(approved, locale),
                    }),
                    failedMessage,
                ].filter(Boolean).join(" "),
            }
            : { type: "info", message: failedMessage });

        setSelectedIds(new Set());
        setBulkOpen(false);

        await Promise.all([
            queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: APPROVAL_HISTORY_QUERY_KEY }),
        ]);
    }

    function updateComment(stepId: string, comment: string) {
        setReasonError(false);
        setComments((current) => ({ ...current, [stepId]: comment }));
    }

    function openConfirm(
        approval: PendingApprovalStep,
        kind: ConfirmAction["kind"],
        event: React.MouseEvent<HTMLButtonElement>
    ) {
        triggerRef.current = event.currentTarget;
        decisionMutation.reset();
        setReasonError(false);
        setConfirmAction({ approval, kind });
    }

    function handleConfirm() {
        if (!confirmAction || decisionMutation.isPending) return;
        if (isRejectReasonMissing) {
            setReasonError(true);
            requestAnimationFrame(() => focusField("confirm-comment"));
            return;
        }

        const { approval, kind } = confirmAction;
        const approved = kind === "approve";

        decisionMutation.mutate(
            {
                stepId: approval.stepId,
                decision: approved ? "approved" : "rejected",
                ...(confirmComment && { comment: confirmComment }),
            },
            {
                onSuccess: async () => {
                    const details = {
                        reference: approval.reference,
                        amount: formatAmount(approval, locale),
                    };

                    // Shown in the "Handled" tab until the backend provides the real history.
                    addSessionDecision(queryClient, user?.id, {
                        stepId: approval.stepId,
                        stepNumber: approval.stepNumber,
                        paymentId: approval.paymentId,
                        reference: approval.reference,
                        amount: approval.amount,
                        currency: approval.currency,
                        toIban: approval.toIban,
                        recipientName: approval.recipientName,
                        createdByUserName: approval.createdByUserName,
                        decision: approved ? "approved" : "rejected",
                        comment: confirmComment || null,
                        decidedAt: new Date().toISOString(),
                    });

                    setActionFeedback({
                        type: approved ? "approved" : "rejected",
                        message: approved
                            ? t("approvalInbox.feedback.approved", details)
                            : t("approvalInbox.feedback.rejected", details),
                    });

                    setComments((current) => {
                        const updated = { ...current };
                        delete updated[approval.stepId];
                        return updated;
                    });

                    setConfirmAction(null);

                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY }),
                        // The decision now belongs in the "Handled" tab.
                        queryClient.invalidateQueries({ queryKey: APPROVAL_HISTORY_QUERY_KEY }),
                    ]);
                },

                onError: async (error) => {
                    // 404/409: another attestant (or another tab) already decided this step.
                    // Close the dialog and refresh so the stale payment disappears from the list.
                    if (error instanceof AppError && (error.status === 404 || error.status === 409)) {
                        decisionMutation.reset();
                        setConfirmAction(null);
                        setActionFeedback({
                            type: "info",
                            message: t("approvalInbox.feedback.alreadyHandled"),
                        });

                        await queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
                    }
                },
            }
        );
    }

    // Move focus to the feedback so keyboard and screen reader users notice the result,
    // and so it scrolls into view even if the user was far down the list.
    useEffect(() => {
        if (actionFeedback) feedbackRef.current?.focus();
    }, [actionFeedback]);

    useEffect(() => {
        if (!confirmAction) return;

        if (confirmAction.kind === "reject") {
            reasonRef.current?.focus();
        } else {
            cancelButtonRef.current?.focus();
        }
    }, [confirmAction]);

    useEffect(() => {
        if (!confirmAction) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                if (!decisionMutation.isPending) {
                    setConfirmAction(null);
                    triggerRef.current?.focus();
                }
                return;
            }

            if (event.key !== "Tab" || !modalRef.current) return;

            const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [confirmAction, decisionMutation.isPending]);

    if (isPending) {
        return (
            <section className={styles.inbox}>
                <ApprovalListSkeleton label={t("approvalInbox.loading")} />
            </section>
        );
    }

    if (isError) {
        return (
            <section className={styles.inbox}>
                <div className={styles.error} role="alert">
                    {error instanceof AppError
                        ? translateSystemText(error.detail ?? error.message, t)
                        : t("approvalInbox.errors.load")}
                </div>
            </section>
        );
    }

    return (
        <section className={styles.inbox} aria-labelledby="approval-inbox-title">
            <header className={styles.header}>
                <div>
                    <div className={styles.titleRow}>
                        <ClipboardCheck size={24} strokeWidth={2} aria-hidden="true" />
                        <h1 id="approval-inbox-title">{t("approvalInbox.title")}</h1>
                    </div>
                    <p className={styles.intro}>
                        {t(activeTab === "handled"
                            ? "approvalInbox.handledDescription"
                            : "approvalInbox.description")}
                    </p>
                </div>
                {activeTab === "pending" && approvals.length > 0 && (
                    <p className={styles.summaryPill} role="status" aria-live="polite">
                        {t("approvalInbox.pendingSummary", { count: approvals.length, total: pendingTotal })}
                    </p>
                )}
            </header>

            {actionFeedback && (
                <div
                    ref={feedbackRef}
                    tabIndex={-1}
                    className={`${styles.feedback} ${actionFeedback.type === "approved"
                        ? styles.feedbackApproved
                        : actionFeedback.type === "rejected"
                            ? styles.feedbackRejected
                            : styles.feedbackInfo
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    <span className={styles.feedbackMessage}>
                        {actionFeedback.type === "approved" ? (
                            <CircleCheck size={18} aria-hidden="true" />
                        ) : actionFeedback.type === "rejected" ? (
                            <CircleX size={18} aria-hidden="true" />
                        ) : (
                            <Info size={18} aria-hidden="true" />
                        )}
                        {actionFeedback.message}
                    </span>

                    {actionFeedback.type !== "info" && activeTab !== "handled" && (
                        <button
                            type="button"
                            className={styles.feedbackLink}
                            onClick={showHandledTab}
                        >
                            {t("approvalInbox.feedback.showHandled")}
                            <ArrowRight size={16} aria-hidden="true" />
                        </button>
                    )}

                    <button
                        type="button"
                        className={styles.feedbackClose}
                        onClick={() => setActionFeedback(null)}
                        aria-label={t("approvalInbox.dismissMessage")}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Tabs and sorting sit above the payment panel. */}
            <div className={styles.tabsRow}>
                <ApprovalTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    pendingCount={approvals.length}
                    handledCount={handledCount}
                />

                {activeTab === "pending" && approvals.length > 0 && (
                    <div className={styles.toolbarSide}>
                        <div className={styles.filterField}>
                            <label htmlFor="pending-sort">
                                {t("approvalInbox.sort.label")}
                            </label>

                            <select
                                id="pending-sort"
                                value={pendingSort}
                                onChange={(event) => {
                                    const sort = event.target.value as SortOption;
                                    setPendingSort(sort);
                                    setSortAnnouncement(t("approvalInbox.sort.announcement", {
                                        order: t(SORT_LABEL_KEYS[sort]),
                                    }));
                                }}
                            >
                                <option value="date-desc">{t("approvalInbox.sort.newest")}</option>
                                <option value="date-asc">{t("approvalInbox.sort.oldest")}</option>
                                <option value="amount-desc">{t("approvalInbox.sort.amountHigh")}</option>
                                <option value="amount-asc">{t("approvalInbox.sort.amountLow")}</option>
                            </select>
                        </div>

                        <p className="visually-hidden" role="status">{sortAnnouncement}</p>
                    </div>
                )}
            </div>

            <div className={styles.panel}>
            {activeTab === "handled" ? (
                <HandledApprovals
                    id={TAB_IDS.handled.panel}
                    labelledBy={TAB_IDS.handled.tab}
                />
            ) : (
            <div
                id={TAB_IDS.pending.panel}
                role="tabpanel"
                aria-labelledby={TAB_IDS.pending.tab}
                // Focusable, as in the ARIA tabs pattern, so Tab from the tab reaches the panel
                // even when it has no buttons (empty inbox, short history).
                tabIndex={0}
                className={styles.tabPanel}
            >
            {/* Select several payments and approve them in one go. Only with two or more,
                since "select all" of one payment is the same as its own Approve button. */}
            {sortedApprovals.length > 1 && (
                <div className={styles.bulkBar}>
                    <label className={styles.selectAll}>
                        <input
                            ref={selectAllRef}
                            type="checkbox"
                            className={styles.selectBox}
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            disabled={decisionMutation.isPending}
                        />
                        {t("approvalInbox.bulk.selectAll")}
                    </label>

                    {selectedApprovals.length > 0 && (
                        <>
                            <p className={styles.bulkSummary} role="status">
                                {t("approvalInbox.bulk.summary", {
                                    count: selectedApprovals.length,
                                    total: formatTotals(selectedApprovals, locale),
                                })}
                            </p>

                            <button
                                type="button"
                                className={styles.approve}
                                disabled={decisionMutation.isPending}
                                onClick={() => setBulkOpen(true)}
                            >
                                <CircleCheck size={17} aria-hidden="true" />
                                {t("approvalInbox.bulk.approveSelected", { count: selectedApprovals.length })}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* No overdue banner: overdue payments are sorted first and their badge turns red. */}
            <div className={styles.list}>
                {sortedApprovals.length > 0 ? (
                    sortedApprovals.map((approval) => (
                        <article
                            className={styles.card}
                            key={approval.stepId}
                            aria-labelledby={`payment-${approval.paymentId}`}
                        >
                            <div className={styles.cardHeader}>
                                {sortedApprovals.length > 1 && (
                                    <input
                                        type="checkbox"
                                        className={styles.selectBox}
                                        checked={selectedIds.has(approval.stepId)}
                                        onChange={() => toggleSelected(approval.stepId)}
                                        disabled={decisionMutation.isPending}
                                        aria-label={t("approvalInbox.bulk.select", { reference: approval.reference })}
                                    />
                                )}

                                <div className={styles.cardInfo}>
                                    {/* Two lines of text: the reference, then who, where, which step and how long.
                                        A badge only when something needs attention (overdue, due soon). */}
                                    <div className={styles.titleLine}>
                                        {/* Labelled, because a reference like "1050" says nothing on its own. */}
                                        <h2 id={`payment-${approval.paymentId}`}>
                                            <span className={styles.referenceLabel}>
                                                {t("approvalInbox.card.reference")}
                                            </span>{" "}
                                            {approval.reference}
                                        </h2>

                                        {isOverdue(approval) && (
                                            <p className={styles.overdue}>
                                                {t("approvalInbox.card.waitingDays", {
                                                    count: daysWaiting(approval),
                                                })}
                                            </p>
                                        )}

                                        <DueBadge approval={approval} />
                                    </div>

                                    {/* No payment id: it is a UUID that means nothing to the attestant,
                                        who recognises the payment by its reference and amount. */}
                                    <p className={styles.cardMeta}>
                                        {/* No recipient here: the IBAN and bank are in the details, once. */}
                                        <span>
                                            {t("approvalInbox.card.submittedBy")} {approval.createdByUserName}
                                        </span>
                                        {" · "}
                                        <span>
                                            {t("approvalInbox.card.approvalStep", {
                                                step: approval.stepNumber,
                                            })}
                                        </span>
                                        {/* No "Dual approval" after it: step 2 already says so. */}
                                        {" · "}
                                        <time dateTime={approval.paymentCreatedAt}>
                                            {sentLabel(approval)}
                                        </time>
                                    </p>

                                    {/* Always visible: a warning must not hide behind a click. */}
                                    <PaymentChecks approval={approval} allPending={approvals} />

                                    {/* On the left with the information, so the right side holds only the decision. */}
                                    <button
                                        type="button"
                                        className={styles.detailsToggle}
                                        aria-expanded={expandedIds.has(approval.stepId)}
                                        aria-controls={`details-${approval.stepId}`}
                                        onClick={() => toggleDetails(approval.stepId)}
                                        aria-label={t(expandedIds.has(approval.stepId)
                                            ? "approvalInbox.card.hideDetailsFor"
                                            : "approvalInbox.card.showDetailsFor", {
                                            reference: approval.reference,
                                        })}
                                    >
                                        {t(expandedIds.has(approval.stepId)
                                            ? "approvalInbox.card.hideDetails"
                                            : "approvalInbox.card.showDetails")}
                                        <ChevronDown
                                            size={16}
                                            aria-hidden="true"
                                            className={expandedIds.has(approval.stepId) ? styles.chevronOpen : undefined}
                                        />
                                    </button>
                                </div>

                                <div className={styles.cardSide}>
                                    <strong>{formatAmount(approval, locale)}</strong>

                                    {/* Hidden while payments are ticked, so "Approve selected" is the only
                                        approve button on screen; they come back when the selection is cleared. */}
                                    {selectedApprovals.length === 0 && (
                                    <div className={styles.actions}>
                                        <button
                                            type="button"
                                            className={styles.reject}
                                            disabled={decisionMutation.isPending}
                                            onClick={(event) => openConfirm(approval, "reject", event)}
                                            aria-label={t("approvalInbox.actions.rejectPayment", {
                                                reference: approval.reference,
                                                amount: formatAmount(approval, locale),
                                            })}
                                        >
                                            <CircleX size={17} aria-hidden="true" />
                                            {t("approvalInbox.actions.reject")}
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.approve}
                                            disabled={decisionMutation.isPending}
                                            onClick={(event) => openConfirm(approval, "approve", event)}
                                            aria-label={t("approvalInbox.actions.approvePayment", {
                                                reference: approval.reference,
                                                amount: formatAmount(approval, locale),
                                            })}
                                        >
                                            <CircleCheck size={17} aria-hidden="true" />
                                            {t("approvalInbox.actions.approve")}
                                        </button>
                                    </div>
                                    )}
                                </div>
                            </div>

                            {expandedIds.has(approval.stepId) && (
                            <dl id={`details-${approval.stepId}`} className={styles.details}>
                                <RecipientAndDueRows approval={approval} />

                                {/* Where the money goes and where it comes from. Who sent it and when
                                    is already on the row above ("Sent today" / "Waiting 2 days"). */}
                                <div>
                                    <dt>{t("approvalInbox.card.toIban")}</dt>
                                    <dd>
                                        {formatIban(approval.toIban)}
                                        {recipientBank(approval.toIban) && ` · ${recipientBank(approval.toIban)}`}
                                    </dd>
                                </div>

                                <PaymentSourceAccount paymentId={approval.paymentId} />
                            </dl>
                            )}
                        </article>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <ClipboardCheck size={32} aria-hidden="true" />
                        <h2>{t("approvalInbox.empty.title")}</h2>
                        <p>{t("approvalInbox.empty.description")}</p>

                        {/* Keeps the inbox useful when everything is handled: go to the decisions.
                            Hidden when there are none, so it doesn't lead to another empty tab. */}
                        {handledCount > 0 && (
                            <button
                                type="button"
                                className={styles.emptyStateAction}
                                onClick={showHandledTab}
                            >
                                {t("approvalInbox.empty.showHandled")}
                                <ArrowRight size={16} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            </div>
            )}
            </div>

            {confirmAction && (
                <div className={styles.modalOverlay} onClick={closeConfirm}>
                    <div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        onClick={(event) => event.stopPropagation()}
                        ref={modalRef}
                    >
                        <h2 id="confirm-modal-title">
                            {confirmAction.kind === "approve"
                                ? t("approvalInbox.modal.approveTitle")
                                : t("approvalInbox.modal.rejectTitle")}
                        </h2>

                        <p>
                            {confirmAction.kind === "approve"
                                ? t("approvalInbox.modal.approveDescription")
                                : t("approvalInbox.modal.rejectDescription")}
                        </p>

                        {/* Who is approving and at which step of the approval chain. */}
                        <div className={styles.modalContext}>
                            {user?.name && (
                                <span>
                                    {t("approvalInbox.modal.attestingAs", {
                                        name: user.name,
                                        step: confirmAction.approval.stepNumber,
                                    })}
                                </span>
                            )}
                            {/* No "Dual approval" line: "Approval step 2" already says so. */}
                        </div>

                        <dl className={styles.modalDetails}>
                            <RecipientAndDueRows approval={confirmAction.approval} />

                            <div>
                                <dt>{t("approvalInbox.card.reference")}</dt>
                                <dd>{confirmAction.approval.reference}</dd>
                            </div>

                            <div>
                                <dt>{t("approvalInbox.modal.amount")}</dt>
                                <dd>
                                    <strong>{formatAmount(confirmAction.approval, locale)}</strong>
                                </dd>
                            </div>

                            <div>
                                <dt>{t("approvalInbox.card.toIban")}</dt>
                                <dd>{formatIban(confirmAction.approval.toIban)}</dd>
                            </div>

                            {recipientBank(confirmAction.approval.toIban) && (
                                <div>
                                    <dt>{t("approvalInbox.card.recipientBank")}</dt>
                                    <dd>{recipientBank(confirmAction.approval.toIban)}</dd>
                                </div>
                            )}

                            <PaymentSourceAccount paymentId={confirmAction.approval.paymentId} />

                            <div>
                                <dt>{t("approvalInbox.card.submittedBy")}</dt>
                                <dd>{confirmAction.approval.createdByUserName}</dd>
                            </div>
                        </dl>

                        <PaymentChecks approval={confirmAction.approval} allPending={approvals} />

                        <div className={styles.commentField}>
                            <label htmlFor="confirm-comment">
                                {confirmAction.kind === "reject"
                                    ? `${t("approvalInbox.comment.rejectReasonLabel")} ${t("approvalInbox.comment.required")}`
                                    : `${t("approvalInbox.comment.label")} ${t("approvalInbox.comment.optional")}`}{confirmAction.kind === "reject" && <RequiredMark />}
                            </label>

                            <textarea
                                id="confirm-comment"
                                ref={reasonRef}
                                value={comments[confirmAction.approval.stepId] ?? ""}
                                onChange={(event) =>
                                    updateComment(confirmAction.approval.stepId, event.target.value)
                                }
                                disabled={decisionMutation.isPending}
                                rows={3}
                                maxLength={COMMENT_MAX_LENGTH}
                                placeholder={t("approvalInbox.comment.placeholder")}
                                required={confirmAction.kind === "reject"}
                                aria-invalid={reasonError}
                                aria-describedby={[confirmAction.kind === "reject" ? "confirm-comment-hint" : "", reasonError ? "confirm-comment-error" : "", "confirm-comment-count"].filter(Boolean).join(" ")}
                            />

                            <div aria-live="assertive">
                                <FieldError id="confirm-comment" errors={reasonError ? {
                                    "confirm-comment": t("validation.rejectReason", { min: REJECT_REASON_MIN_LENGTH }),
                                } : {}} />
                            </div>
                            {confirmAction.kind === "reject" && (
                                <span id="confirm-comment-hint" className={styles.commentHint}>
                                    {t("approvalInbox.comment.rejectReasonHint", {
                                        min: REJECT_REASON_MIN_LENGTH,
                                    })}
                                </span>
                            )}

                            {/* "12/300" visually, "12 of 300 characters" for screen readers. */}
                            <span id="confirm-comment-count" className={styles.commentCount}>
                                <span aria-hidden="true">
                                    {(comments[confirmAction.approval.stepId] ?? "").length}/{COMMENT_MAX_LENGTH}
                                </span>
                                <span className="visually-hidden">
                                    {t("approvalInbox.comment.characterCount", {
                                        count: (comments[confirmAction.approval.stepId] ?? "").length,
                                        max: COMMENT_MAX_LENGTH,
                                    })}
                                </span>
                            </span>
                        </div>

                        {decisionMutation.isError && (
                            <div className={styles.error} role="alert">
                                {getErrorMessage(
                                    decisionMutation.error,
                                    t("approvalInbox.errors.decision")
                                )}
                            </div>
                        )}

                        {/* Always rendered, so screen readers pick up the text when it appears. */}
                        <p className="visually-hidden" role="status">
                            {decisionMutation.isPending ? t("approvalInbox.actions.processing") : ""}
                        </p>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancel}
                                disabled={decisionMutation.isPending}
                                onClick={closeConfirm}
                                ref={cancelButtonRef}
                            >
                                {t("common.cancel")}
                            </button>

                            <button
                                type="button"
                                className={
                                    confirmAction.kind === "approve"
                                        ? styles.approve
                                        : styles.reject
                                }
                                // aria-disabled instead of disabled: a disabled button loses focus,
                                // which drops keyboard and screen reader users to the top of the page.
                                aria-disabled={decisionMutation.isPending}
                                onClick={handleConfirm}
                            >
                                {decisionMutation.isPending ? (
                                    t("approvalInbox.actions.processing")
                                ) : confirmAction.kind === "approve" ? (
                                    <>
                                        <CircleCheck size={17} aria-hidden="true" />
                                        {t("approvalInbox.actions.approve")}
                                    </>
                                ) : (
                                    <>
                                        <CircleX size={17} aria-hidden="true" />
                                        {t("approvalInbox.actions.reject")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {bulkOpen && selectedApprovals.length > 0 && (
                <BulkApproveDialog
                    approvals={selectedApprovals}
                    allPending={approvals}
                    locale={locale}
                    onClose={() => setBulkOpen(false)}
                    onDone={handleBulkDone}
                />
            )}
        </section>
    );
}
