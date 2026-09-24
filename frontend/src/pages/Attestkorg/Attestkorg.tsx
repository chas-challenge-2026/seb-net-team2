import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    APPROVALS_QUERY_KEY,
    useApprovals,
} from "../../hooks/useApprovals";

import {
    decideApproval,
} from "../../services/approvalService";

import type {
    PendingApprovalStep,
} from "../../schemas/pendingApprovalSchema";

import { AppError } from "../../errors/AppError";

import styles from "./Attestkorg.module.css";

const COMMENT_MAX_LENGTH = 300;

type SortOption =
    | "date-desc"
    | "date-asc"
    | "amount-desc"
    | "amount-asc";

type ConfirmAction = {
    approval: PendingApprovalStep;
    kind: "approve" | "reject";
};

type ActionFeedback = {
    type: "approved" | "rejected";
    message: string;
};

function formatAmount(
    approval: PendingApprovalStep
): string {
    return `${approval.amount.toLocaleString(
        "sv-SE",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )} ${approval.currency}`;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleString(
        "sv-SE",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    );
}

function sortApprovals(
    approvals: PendingApprovalStep[],
    sortOption: SortOption
): PendingApprovalStep[] {
    return [...approvals].sort(
        (a, b) => {
            switch (sortOption) {
                case "date-asc":
                    return (
                        new Date(
                            a.paymentCreatedAt
                        ).getTime() -
                        new Date(
                            b.paymentCreatedAt
                        ).getTime()
                    );

                case "date-desc":
                    return (
                        new Date(
                            b.paymentCreatedAt
                        ).getTime() -
                        new Date(
                            a.paymentCreatedAt
                        ).getTime()
                    );

                case "amount-asc":
                    return (
                        a.amount -
                        b.amount
                    );

                case "amount-desc":
                    return (
                        b.amount -
                        a.amount
                    );
            }
        }
    );
}

function getErrorMessage(
    error: unknown
): string {
    if (error instanceof AppError) {
        return (
            error.detail ??
            error.message
        );
    }

    return "Unable to process the approval decision.";
}

export function Attestkorg() {
    const {
        data: approvals = [],
        isPending,
        isError,
        error,
    } = useApprovals();

    const queryClient =
        useQueryClient();

    const [
        pendingSort,
        setPendingSort,
    ] = useState<SortOption>(
        "date-desc"
    );

    const [
        comments,
        setComments,
    ] = useState<
        Record<number, string>
    >({});

    const [
        confirmAction,
        setConfirmAction,
    ] =
        useState<ConfirmAction | null>(
            null
        );

    const [
        actionFeedback,
        setActionFeedback,
    ] =
        useState<ActionFeedback | null>(
            null
        );

    const cancelButtonRef =
        useRef<HTMLButtonElement>(
            null
        );

    const modalRef =
        useRef<HTMLDivElement>(
            null
        );

    const decisionMutation =
        useMutation({
            mutationFn: decideApproval,

            onSuccess: async (
                _,
                decision
            ) => {
                setActionFeedback({
                    type:
                        decision.decision ===
                            "approved"
                            ? "approved"
                            : "rejected",

                    message:
                        decision.decision ===
                            "approved"
                            ? "Payment was approved successfully."
                            : "Payment was rejected successfully.",
                });

                setComments(
                    (current) => {
                        const updated = {
                            ...current,
                        };

                        delete updated[
                            decision.stepId
                        ];

                        return updated;
                    }
                );

                setConfirmAction(null);

                await queryClient.invalidateQueries({
                    queryKey:
                        APPROVALS_QUERY_KEY,
                });
            },
        });

    const sortedApprovals =
        sortApprovals(
            approvals,
            pendingSort
        );

    function closeConfirm() {
        if (
            decisionMutation.isPending
        ) {
            return;
        }

        setConfirmAction(null);
    }

    function updateComment(
        stepId: number,
        comment: string
    ) {
        setComments(
            (current) => ({
                ...current,
                [stepId]: comment,
            })
        );
    }

    function handleApprove(
        approval: PendingApprovalStep
    ) {
        decisionMutation.reset();

        setConfirmAction({
            approval,
            kind: "approve",
        });
    }

    function handleReject(
        approval: PendingApprovalStep
    ) {
        decisionMutation.reset();

        setConfirmAction({
            approval,
            kind: "reject",
        });
    }

    function handleConfirm() {
        if (!confirmAction) {
            return;
        }

        const {
            approval,
            kind,
        } = confirmAction;

        const comment =
            comments[
                approval.stepId
            ]?.trim();

        decisionMutation.mutate({
            stepId:
                approval.stepId,

            decision:
                kind === "approve"
                    ? "approved"
                    : "rejected",

            ...(comment && {
                comment,
            }),
        });
    }

    useEffect(() => {
        if (!confirmAction) {
            return;
        }

        cancelButtonRef.current?.focus();

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (
                event.key === "Escape"
            ) {
                if (
                    !decisionMutation.isPending
                ) {
                    setConfirmAction(
                        null
                    );
                }

                return;
            }

            if (
                event.key !== "Tab" ||
                !modalRef.current
            ) {
                return;
            }

            const focusable =
                modalRef.current
                    .querySelectorAll<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    );

            if (
                focusable.length === 0
            ) {
                return;
            }

            const first =
                focusable[0];

            const last =
                focusable[
                focusable.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement ===
                first
            ) {
                event.preventDefault();

                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement ===
                last
            ) {
                event.preventDefault();

                first.focus();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        confirmAction,
        decisionMutation.isPending,
    ]);

    if (isPending) {
        return (
            <section
                className={
                    styles.inbox
                }
            >
                <div
                    className={
                        styles.loadingState
                    }
                    role="status"
                >
                    Loading approvals...
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section
                className={
                    styles.inbox
                }
            >
                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >
                    {error instanceof
                        AppError
                        ? error.detail ??
                        error.message
                        : "Unable to load approvals."}
                </div>
            </section>
        );
    }

    return (
        <section
            className={
                styles.inbox
            }
            aria-labelledby="approval-inbox-title"
        >
            <header
                className={
                    styles.header
                }
            >
                <div>
                    <h1
                        id="approval-inbox-title"
                    >
                        Approval inbox
                    </h1>

                    <p
                        className={
                            styles.intro
                        }
                    >
                        Payments awaiting
                        your decision.
                    </p>
                </div>

                <span
                    className={`${styles.count} ${approvals.length ===
                            0
                            ? styles.countZero
                            : ""
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    {approvals.length}{" "}
                    pending
                </span>
            </header>

            {actionFeedback && (
                <div
                    className={`${styles.feedback} ${actionFeedback.type ===
                            "approved"
                            ? styles.feedbackApproved
                            : styles.feedbackRejected
                        }`}
                    role="status"
                    aria-live="polite"
                >
                    <span>
                        {
                            actionFeedback.message
                        }
                    </span>

                    <button
                        type="button"
                        className={
                            styles.feedbackClose
                        }
                        onClick={() =>
                            setActionFeedback(
                                null
                            )
                        }
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            {decisionMutation.isError && (
                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >
                    {getErrorMessage(
                        decisionMutation.error
                    )}
                </div>
            )}

            {approvals.length > 0 && (
                <div
                    className={
                        styles.toolbar
                    }
                >
                    <div
                        className={
                            styles.filterField
                        }
                    >
                        <label
                            htmlFor="pending-sort"
                        >
                            Sort by
                        </label>

                        <select
                            id="pending-sort"
                            value={
                                pendingSort
                            }
                            onChange={(
                                event
                            ) =>
                                setPendingSort(
                                    event
                                        .target
                                        .value as SortOption
                                )
                            }
                        >
                            <option value="date-desc">
                                Newest
                                first
                            </option>

                            <option value="date-asc">
                                Oldest
                                first
                            </option>

                            <option value="amount-desc">
                                Amount:
                                high to
                                low
                            </option>

                            <option value="amount-asc">
                                Amount:
                                low to
                                high
                            </option>
                        </select>
                    </div>
                </div>
            )}

            <div
                className={
                    styles.list
                }
            >
                {sortedApprovals.length >
                    0 ? (
                    sortedApprovals.map(
                        (approval) => (
                            <article
                                className={
                                    styles.card
                                }
                                key={
                                    approval.stepId
                                }
                                aria-labelledby={`payment-${approval.paymentId}`}
                            >
                                <div
                                    className={
                                        styles.cardHeader
                                    }
                                >
                                    <div>
                                        <p
                                            className={
                                                styles.paymentId
                                            }
                                        >
                                            Approval
                                            step{" "}
                                            {
                                                approval.stepNumber
                                            }
                                        </p>

                                        <h2
                                            id={`payment-${approval.paymentId}`}
                                        >
                                            Payment
                                            #
                                            {
                                                approval.paymentId
                                            }
                                        </h2>
                                    </div>

                                    <strong>
                                        {formatAmount(
                                            approval
                                        )}
                                    </strong>
                                </div>

                                <dl
                                    className={
                                        styles.details
                                    }
                                >
                                    <div>
                                        <dt>
                                            Reference
                                        </dt>

                                        <dd>
                                            {
                                                approval.reference
                                            }
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            Submitted
                                            by
                                        </dt>

                                        <dd>
                                            {
                                                approval.createdByUserName
                                            }
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            Submitted
                                        </dt>

                                        <dd>
                                            {formatDate(
                                                approval.paymentCreatedAt
                                            )}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt>
                                            To IBAN
                                        </dt>

                                        <dd>
                                            {
                                                approval.toIban
                                            }
                                        </dd>
                                    </div>
                                </dl>

                                <div
                                    className={
                                        styles.commentField
                                    }
                                >
                                    <label
                                        htmlFor={`approval-${approval.stepId}-comment`}
                                    >
                                        Comment
                                        (optional)
                                    </label>

                                    <textarea
                                        id={`approval-${approval.stepId}-comment`}
                                        value={
                                            comments[
                                            approval
                                                .stepId
                                            ] ??
                                            ""
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateComment(
                                                approval.stepId,
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            decisionMutation.isPending
                                        }
                                        rows={
                                            2
                                        }
                                        maxLength={
                                            COMMENT_MAX_LENGTH
                                        }
                                        placeholder="Add a comment"
                                    />

                                    <span
                                        className={
                                            styles.commentCount
                                        }
                                    >
                                        {
                                            (
                                                comments[
                                                approval
                                                    .stepId
                                                ] ??
                                                ""
                                            ).length
                                        }
                                        /
                                        {
                                            COMMENT_MAX_LENGTH
                                        }
                                    </span>
                                </div>

                                <div
                                    className={
                                        styles.actions
                                    }
                                >
                                    <button
                                        type="button"
                                        className={
                                            styles.reject
                                        }
                                        disabled={
                                            decisionMutation.isPending
                                        }
                                        onClick={() =>
                                            handleReject(
                                                approval
                                            )
                                        }
                                        aria-label={`Reject payment ${approval.paymentId}`}
                                    >
                                        Reject
                                    </button>

                                    <button
                                        type="button"
                                        className={
                                            styles.approve
                                        }
                                        disabled={
                                            decisionMutation.isPending
                                        }
                                        onClick={() =>
                                            handleApprove(
                                                approval
                                            )
                                        }
                                        aria-label={`Approve payment ${approval.paymentId}`}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </article>
                        )
                    )
                ) : (
                    <div
                        className={
                            styles.emptyState
                        }
                    >
                        <h2>
                            No pending
                            approvals
                        </h2>

                        <p>
                            There are no
                            payments waiting
                            for your approval.
                        </p>
                    </div>
                )}
            </div>

            {confirmAction && (
                <div
                    className={
                        styles.modalOverlay
                    }
                    onClick={
                        closeConfirm
                    }
                >
                    <div
                        className={
                            styles.modal
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        onClick={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                        ref={
                            modalRef
                        }
                    >
                        <h2
                            id="confirm-modal-title"
                        >
                            {confirmAction.kind ===
                                "approve"
                                ? "Approve"
                                : "Reject"}{" "}
                            payment?
                        </h2>

                        <p>
                            {confirmAction.kind ===
                                "approve"
                                ? "Approve"
                                : "Reject"}{" "}
                            payment{" "}
                            <strong>
                                #
                                {
                                    confirmAction
                                        .approval
                                        .paymentId
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {formatAmount(
                                    confirmAction.approval
                                )}
                            </strong>
                            ?
                        </p>

                        <div
                            className={
                                styles.modalActions
                            }
                        >
                            <button
                                type="button"
                                className={
                                    styles.modalCancel
                                }
                                disabled={
                                    decisionMutation.isPending
                                }
                                onClick={
                                    closeConfirm
                                }
                                ref={
                                    cancelButtonRef
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    confirmAction.kind ===
                                        "approve"
                                        ? styles.approve
                                        : styles.reject
                                }
                                disabled={
                                    decisionMutation.isPending
                                }
                                onClick={
                                    handleConfirm
                                }
                            >
                                {decisionMutation.isPending
                                    ? "Processing..."
                                    : confirmAction.kind ===
                                        "approve"
                                        ? "Approve"
                                        : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}