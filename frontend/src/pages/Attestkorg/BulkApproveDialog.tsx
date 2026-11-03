import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { useModalFocus } from "../../hooks/useModalFocus";
import { decideApproval } from "../../services/approvalService";
import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { checkPayment } from "../../utils/paymentChecks";
import { formatAmount, formatTotals } from "./approvalFormat";

import styles from "./Attestkorg.module.css";

const COMMENT_MAX_LENGTH = 300;

export type BulkApproveResult = {
    approved: PendingApprovalStep[];
    failed: PendingApprovalStep[];
    comment: string;
};

type BulkApproveDialogProps = {
    approvals: PendingApprovalStep[];
    allPending: PendingApprovalStep[];
    locale: string;
    onClose: () => void;
    onDone: (result: BulkApproveResult) => void;
};

function hasWarning(approval: PendingApprovalStep, allPending: PendingApprovalStep[]): boolean {
    const checks = checkPayment(approval, allPending);
    return !checks.ibanValid || checks.foreignCountry !== null || checks.duplicateOf.length > 0 || checks.highAmount;
}

// Approves several payments in one go. The backend decides one step per request, so the steps
// are sent one after another; a step that fails (e.g. already decided by someone else) does not
// stop the rest, and is reported at the end.
export function BulkApproveDialog({ approvals, allPending, locale, onClose, onDone }: BulkApproveDialogProps) {
    const { t } = useTranslation();
    const [comment, setComment] = useState("");
    const [done, setDone] = useState<number | null>(null);
    const running = done !== null;

    const modalRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    useModalFocus(true, modalRef);

    // Cancel first, as in the single dialog: Enter must not approve by accident.
    useEffect(() => {
        cancelButtonRef.current?.focus();
    }, []);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !running) onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [running, onClose]);

    const warningCount = approvals.filter((approval) => hasWarning(approval, allPending)).length;
    const trimmedComment = comment.trim();

    async function handleConfirm() {
        if (running) return;

        const approved: PendingApprovalStep[] = [];
        const failed: PendingApprovalStep[] = [];
        setDone(0);

        for (const approval of approvals) {
            try {
                await decideApproval({
                    stepId: approval.stepId,
                    decision: "approved",
                    ...(trimmedComment && { comment: trimmedComment }),
                });
                approved.push(approval);
            } catch {
                failed.push(approval);
            }
            setDone(approved.length + failed.length);
        }

        onDone({ approved, failed, comment: trimmedComment });
    }

    return (
        <div className={styles.modalOverlay} onClick={() => !running && onClose()}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="bulk-modal-title"
                onClick={(event) => event.stopPropagation()}
                ref={modalRef}
            >
                <h2 id="bulk-modal-title">
                    {t("approvalInbox.bulk.title", { count: approvals.length })}
                </h2>

                <p>{t("approvalInbox.bulk.description")}</p>

                <ul className={styles.bulkList} aria-label={t("approvalInbox.bulk.listLabel")}>
                    {approvals.map((approval) => (
                        <li key={approval.stepId}>
                            <span className={styles.bulkReference}>
                                {approval.reference}
                                {hasWarning(approval, allPending) && (
                                    <span className={styles.bulkWarning}>
                                        <TriangleAlert size={14} aria-hidden="true" />
                                        {t("approvalInbox.bulk.hasWarning")}
                                    </span>
                                )}
                            </span>
                            <span>{formatAmount(approval, locale)}</span>
                        </li>
                    ))}

                    <li className={styles.bulkTotal}>
                        <span>{t("approvalInbox.bulk.total")}</span>
                        <strong>{formatTotals(approvals, locale)}</strong>
                    </li>
                </ul>

                {warningCount > 0 && (
                    <p className={styles.bulkWarningNote}>
                        <TriangleAlert size={16} aria-hidden="true" />
                        {t("approvalInbox.bulk.warnings", { count: warningCount })}
                    </p>
                )}

                <div className={styles.commentField}>
                    <label htmlFor="bulk-comment">
                        {`${t("approvalInbox.comment.label")} ${t("approvalInbox.comment.optional")}`}
                    </label>

                    <textarea
                        id="bulk-comment"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        disabled={running}
                        rows={3}
                        maxLength={COMMENT_MAX_LENGTH}
                        placeholder={t("approvalInbox.comment.placeholder")}
                    />
                </div>

                {/* Always rendered, so screen readers pick up the progress when it changes. */}
                <p className="visually-hidden" role="status">
                    {running ? t("approvalInbox.bulk.progress", { done, count: approvals.length }) : ""}
                </p>

                <div className={styles.modalActions}>
                    <button
                        type="button"
                        className={styles.modalCancel}
                        disabled={running}
                        onClick={onClose}
                        ref={cancelButtonRef}
                    >
                        {t("common.cancel")}
                    </button>

                    <button
                        type="button"
                        className={styles.approve}
                        // aria-disabled instead of disabled, so the button keeps focus while it works.
                        aria-disabled={running}
                        onClick={handleConfirm}
                    >
                        {running ? (
                            t("approvalInbox.bulk.progress", { done, count: approvals.length })
                        ) : (
                            <>
                                <CircleCheck size={17} aria-hidden="true" />
                                {t("approvalInbox.bulk.confirm", { count: approvals.length })}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
