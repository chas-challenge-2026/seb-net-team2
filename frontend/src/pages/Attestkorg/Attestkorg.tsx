import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { APPROVALS_QUERY_KEY, useApprovals } from "../../hooks/useApprovals";
import { decideApproval } from "../../services/approvalService";
import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { AppError } from "../../errors/AppError";
import { OVERDUE_AFTER_DAYS, daysWaiting, isOverdue } from "../../utils/approvalReminders";

import styles from "./Attestkorg.module.css";

const COMMENT_MAX_LENGTH = 300;

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

type ConfirmAction = {
    approval: PendingApprovalStep;
    kind: "approve" | "reject";
};

type ActionFeedback = {
    type: "approved" | "rejected";
    message: string;
};

function formatAmount(approval: PendingApprovalStep, locale: string): string {
    return `${approval.amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${approval.currency}`;
}

function formatDate(date: string, locale: string): string {
    return new Date(date).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

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
    if (error instanceof AppError) return error.detail ?? error.message;
    return fallback;
}

export function Attestkorg() {
    const { t, i18n } = useTranslation();
    const { data: approvals = [], isPending, isError, error } = useApprovals();
    const queryClient = useQueryClient();

    const [pendingSort, setPendingSort] = useState<SortOption>("date-desc");
    const [comments, setComments] = useState<Record<number, string>>({});
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const decisionMutation = useMutation({
        mutationFn: decideApproval,

        onSuccess: async (_, decision) => {
            const approved = decision.decision === "approved";

            setActionFeedback({
                type: approved ? "approved" : "rejected",
                message: approved
                    ? t("approvalInbox.feedback.approved")
                    : t("approvalInbox.feedback.rejected"),
            });

            setComments((current) => {
                const updated = { ...current };
                delete updated[decision.stepId];
                return updated;
            });

            setConfirmAction(null);

            await queryClient.invalidateQueries({
                queryKey: APPROVALS_QUERY_KEY,
            });
        },
    });

    const sortedApprovals = sortApprovals(approvals, pendingSort).sort(
        (a, b) => Number(isOverdue(b)) - Number(isOverdue(a))
    );

    const overdueCount = approvals.filter(isOverdue).length;

    function closeConfirm() {
        if (decisionMutation.isPending) return;
        setConfirmAction(null);
    }

    function updateComment(stepId: number, comment: string) {
        setComments((current) => ({ ...current, [stepId]: comment }));
    }

    function handleApprove(approval: PendingApprovalStep) {
        decisionMutation.reset();
        setConfirmAction({ approval, kind: "approve" });
    }

    function handleReject(approval: PendingApprovalStep) {
        decisionMutation.reset();
        setConfirmAction({ approval, kind: "reject" });
    }

    function handleConfirm() {
        if (!confirmAction) return;

        const { approval, kind } = confirmAction;
        const comment = comments[approval.stepId]?.trim();

        decisionMutation.mutate({
            stepId: approval.stepId,
            decision: kind === "approve" ? "approved" : "rejected",
            ...(comment && { comment }),
        });
    }

    useEffect(() => {
        if (!confirmAction) return;

        cancelButtonRef.current?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                if (!decisionMutation.isPending) setConfirmAction(null);
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
                <div className={styles.loadingState} role="status">
                    {t("approvalInbox.loading")}
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section className={styles.inbox}>
                <div className={styles.error} role="alert">
                    {error instanceof AppError
                        ? error.detail ?? error.message
                        : t("approvalInbox.errors.load")}
                </div>
            </section>
        );
    }

    return (
        <section className={styles.inbox} aria-labelledby="approval-inbox-title">
            <header className={styles.header}>
                <div>
                    <h1 id="approval-inbox-title">{t("approvalInbox.title")}</h1>
                    <p className={styles.intro}>{t("approvalInbox.description")}</p>
                </div>

                <span
                    className={`${styles.count} ${approvals.length === 0 ? styles.countZero : ""}`}
                    role="status"
                    aria-live="polite"
                >
                    {t("approvalInbox.pendingCount", { count: approvals.length })}
                </span>
            </header>

            {actionFeedback && (
                <div
                    className={`${styles.feedback} ${actionFeedback.type === "approved"
                            ? styles.feedbackApproved
                            : styles.feedbackRejected
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    <span>{actionFeedback.message}</span>

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

            {overdueCount > 0 && (
                <div className={styles.overdueBanner} role="status">
                    <strong>
                        {t("approvalInbox.overdueBanner", {
                            count: overdueCount,
                            days: OVERDUE_AFTER_DAYS,
                        })}
                    </strong>{" "}
                    {t("approvalInbox.overdueFirst")}
                </div>
            )}

            {decisionMutation.isError && (
                <div className={styles.error} role="alert">
                    {getErrorMessage(
                        decisionMutation.error,
                        t("approvalInbox.errors.decision")
                    )}
                </div>
            )}

            {approvals.length > 0 && (
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="pending-sort">
                            {t("approvalInbox.sort.label")}
                        </label>

                        <select
                            id="pending-sort"
                            value={pendingSort}
                            onChange={(event) => setPendingSort(event.target.value as SortOption)}
                        >
                            <option value="date-desc">{t("approvalInbox.sort.newest")}</option>
                            <option value="date-asc">{t("approvalInbox.sort.oldest")}</option>
                            <option value="amount-desc">{t("approvalInbox.sort.amountHigh")}</option>
                            <option value="amount-asc">{t("approvalInbox.sort.amountLow")}</option>
                        </select>
                    </div>
                </div>
            )}

            <div className={styles.list}>
                {sortedApprovals.length > 0 ? (
                    sortedApprovals.map((approval) => (
                        <article
                            className={`${styles.card} ${isOverdue(approval) ? styles.cardOverdue : ""}`}
                            key={approval.stepId}
                            aria-labelledby={`payment-${approval.paymentId}`}
                        >
                            <div className={styles.cardHeader}>
                                <div>
                                    <p className={styles.paymentId}>
                                        {t("approvalInbox.card.approvalStep", {
                                            step: approval.stepNumber,
                                        })}
                                    </p>

                                    <h2 id={`payment-${approval.paymentId}`}>
                                        {t("approvalInbox.card.payment", {
                                            id: approval.paymentId,
                                        })}
                                    </h2>

                                    {isOverdue(approval) && (
                                        <p className={styles.overdue}>
                                            {t("approvalInbox.card.waitingDays", {
                                                count: daysWaiting(approval),
                                            })}
                                        </p>
                                    )}
                                </div>

                                <strong>{formatAmount(approval, locale)}</strong>
                            </div>

                            <dl className={styles.details}>
                                <div>
                                    <dt>{t("approvalInbox.card.reference")}</dt>
                                    <dd>{approval.reference}</dd>
                                </div>

                                <div>
                                    <dt>{t("approvalInbox.card.submittedBy")}</dt>
                                    <dd>{approval.createdByUserName}</dd>
                                </div>

                                <div>
                                    <dt>{t("approvalInbox.card.submitted")}</dt>
                                    <dd>{formatDate(approval.paymentCreatedAt, locale)}</dd>
                                </div>

                                <div>
                                    <dt>{t("approvalInbox.card.toIban")}</dt>
                                    <dd>{approval.toIban}</dd>
                                </div>
                            </dl>

                            <div className={styles.commentField}>
                                <label htmlFor={`approval-${approval.stepId}-comment`}>
                                    {t("approvalInbox.comment.label")}{" "}
                                    {t("approvalInbox.comment.optional")}
                                </label>

                                <textarea
                                    id={`approval-${approval.stepId}-comment`}
                                    value={comments[approval.stepId] ?? ""}
                                    onChange={(event) => updateComment(approval.stepId, event.target.value)}
                                    disabled={decisionMutation.isPending}
                                    rows={2}
                                    maxLength={COMMENT_MAX_LENGTH}
                                    placeholder={t("approvalInbox.comment.placeholder")}
                                />

                                <span className={styles.commentCount}>
                                    {(comments[approval.stepId] ?? "").length}/{COMMENT_MAX_LENGTH}
                                </span>
                            </div>

                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.reject}
                                    disabled={decisionMutation.isPending}
                                    onClick={() => handleReject(approval)}
                                    aria-label={t("approvalInbox.actions.rejectPayment", {
                                        id: approval.paymentId,
                                    })}
                                >
                                    {t("approvalInbox.actions.reject")}
                                </button>

                                <button
                                    type="button"
                                    className={styles.approve}
                                    disabled={decisionMutation.isPending}
                                    onClick={() => handleApprove(approval)}
                                    aria-label={t("approvalInbox.actions.approvePayment", {
                                        id: approval.paymentId,
                                    })}
                                >
                                    {t("approvalInbox.actions.approve")}
                                </button>
                            </div>
                        </article>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <h2>{t("approvalInbox.empty.title")}</h2>
                        <p>{t("approvalInbox.empty.description")}</p>
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
                                : t("approvalInbox.modal.rejectDescription")}{" "}
                            <strong>#{confirmAction.approval.paymentId}</strong>{" "}
                            {t("approvalInbox.modal.of")}{" "}
                            <strong>{formatAmount(confirmAction.approval, locale)}</strong>?
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
                                disabled={decisionMutation.isPending}
                                onClick={handleConfirm}
                            >
                                {decisionMutation.isPending
                                    ? t("approvalInbox.actions.processing")
                                    : confirmAction.kind === "approve"
                                        ? t("approvalInbox.actions.approve")
                                        : t("approvalInbox.actions.reject")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}