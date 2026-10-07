import { focusField } from "../../components/FormValidation/useFormValidation";
import { FieldError } from "../../components/FormValidation/FormErrors";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    CircleCheck,
    CircleX,
    ClipboardCheck,
    Clock3,
    Info,
} from "lucide-react";

import { APPROVALS_QUERY_KEY, useApprovals } from "../../hooks/useApprovals";
import { decideApproval } from "../../services/approvalService";
import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { AppError } from "../../errors/AppError";
import { OVERDUE_AFTER_DAYS, daysWaiting, isOverdue } from "../../utils/approvalReminders";
import { recipientBank } from "../../utils/paymentChecks";

import { PaymentChecks } from "./PaymentChecks";
import styles from "./Attestkorg.module.css";

const COMMENT_MAX_LENGTH = 300;
const REJECT_REASON_MIN_LENGTH = 10;

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

type ConfirmAction = {
    approval: PendingApprovalStep;
    kind: "approve" | "reject";
};

type ActionFeedback = {
    type: "approved" | "rejected" | "info";
    message: string;
};

function formatAmount(approval: PendingApprovalStep, locale: string): string {
    return `${approval.amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${approval.currency}`;
}

// Groups the IBAN in blocks of four (e.g. "SE60 3000 0000 ...") so the attestant can check it by eye.
function formatIban(iban: string): string {
    return iban.replace(/\s/g, "").replace(/(.{4})(?=.)/g, "$1 ");
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

    // Oldest first: the payments that have waited longest are the most urgent for an attestant.
    const [pendingSort, setPendingSort] = useState<SortOption>("date-asc");
    const [comments, setComments] = useState<Record<number, string>>({});
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);

    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const [reasonError, setReasonError] = useState(false);
    const reasonRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const feedbackRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const decisionMutation = useMutation({
        mutationFn: decideApproval,
    });

    const sortedApprovals = sortApprovals(approvals, pendingSort).sort(
        (a, b) => Number(isOverdue(b)) - Number(isOverdue(a))
    );

    const overdueCount = approvals.filter(isOverdue).length;

    // Summed per currency, since payments in different currencies can't be added together.
    const totalsByCurrency = approvals.reduce<Record<string, number>>((totals, approval) => {
        totals[approval.currency] = (totals[approval.currency] ?? 0) + approval.amount;
        return totals;
    }, {});

    const pendingTotal = Object.entries(totalsByCurrency)
        .map(([currency, amount]) =>
            `${amount.toLocaleString(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} ${currency}`
        )
        .join(" + ");

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

    function updateComment(stepId: number, comment: string) {
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
        if (!confirmAction) return;
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

                    await queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
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
                    <div className={styles.titleRow}>
                        <ClipboardCheck size={24} strokeWidth={2} aria-hidden="true" />
                        <h1 id="approval-inbox-title">{t("approvalInbox.title")}</h1>
                    </div>
                    <p className={styles.intro}>{t("approvalInbox.description")}</p>
                </div>

                <span
                    className={`${styles.count} ${approvals.length === 0 ? styles.countZero : ""}`}
                    role="status"
                    aria-live="polite"
                >
                    {t("approvalInbox.pendingCount", { count: approvals.length })}
                    {approvals.length > 0 && ` · ${pendingTotal}`}
                </span>
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
                    <Clock3 size={18} aria-hidden="true" />
                    <span>
                        <strong>
                            {t("approvalInbox.overdueBanner", {
                                count: overdueCount,
                                days: OVERDUE_AFTER_DAYS,
                            })}
                        </strong>{" "}
                        {t("approvalInbox.overdueFirst")}
                    </span>
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
                                        {t("approvalInbox.card.stepAndPayment", {
                                            step: approval.stepNumber,
                                            id: approval.paymentId,
                                        })}
                                    </p>

                                    <h2 id={`payment-${approval.paymentId}`}>
                                        {approval.reference}
                                    </h2>

                                    <p className={isOverdue(approval) ? styles.overdue : styles.waiting}>
                                        {daysWaiting(approval) === 0
                                            ? t("approvalInbox.card.waitingToday")
                                            : t("approvalInbox.card.waitingDays", {
                                                count: daysWaiting(approval),
                                            })}
                                    </p>

                                    {approval.stepNumber > 1 && (
                                        <p className={styles.dualApproval}>
                                            {t("approvalInbox.card.dualApproval")}
                                        </p>
                                    )}
                                </div>

                                <strong>{formatAmount(approval, locale)}</strong>
                            </div>

                            <dl className={styles.details}>
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
                                    <dd>{formatIban(approval.toIban)}</dd>
                                </div>

                                {recipientBank(approval.toIban) && (
                                    <div>
                                        <dt>{t("approvalInbox.card.recipientBank")}</dt>
                                        <dd>{recipientBank(approval.toIban)}</dd>
                                    </div>
                                )}
                            </dl>

                            <PaymentChecks approval={approval} allPending={approvals} />

                            <div className={styles.actions}>
                                <button
                                    type="button"
                                    className={styles.reject}
                                    disabled={decisionMutation.isPending}
                                    onClick={(event) => openConfirm(approval, "reject", event)}
                                    aria-label={t("approvalInbox.actions.rejectPayment", {
                                        id: approval.paymentId,
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
                                        id: approval.paymentId,
                                    })}
                                >
                                    <CircleCheck size={17} aria-hidden="true" />
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
                                : t("approvalInbox.modal.rejectDescription")}
                        </p>

                        <dl className={styles.modalDetails}>
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

                            <div>
                                <dt>{t("approvalInbox.card.submittedBy")}</dt>
                                <dd>{confirmAction.approval.createdByUserName}</dd>
                            </div>
                        </dl>

                        <div className={styles.commentField}>
                            <label htmlFor="confirm-comment">
                                {confirmAction.kind === "reject"
                                    ? `${t("approvalInbox.comment.rejectReasonLabel")} ${t("approvalInbox.comment.required")}`
                                    : `${t("approvalInbox.comment.label")} ${t("approvalInbox.comment.optional")}`}
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
                                aria-describedby={[confirmAction.kind === "reject" ? "confirm-comment-hint" : "", reasonError ? "confirm-comment-error" : ""].filter(Boolean).join(" ") || undefined}
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

                            <span className={styles.commentCount}>
                                {(comments[confirmAction.approval.stepId] ?? "").length}/{COMMENT_MAX_LENGTH}
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
        </section>
    );
}
