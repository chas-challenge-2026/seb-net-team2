import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useEntityHistory, type AuditEntityRef } from "../../hooks/useAuditLog";
import { actionKind, formatTimestamp, readDecisionDetails } from "./auditFormat";

import styles from "./Granskningslogg.module.css";

const KIND_ICON = { success: "✓", danger: "✕", neutral: "●" } as const;

type EntityHistoryDialogProps = {
    entity: AuditEntityRef | null;
    onClose: () => void;
};

// Timeline of everything that happened to one item, e.g. a payment:
// created → approval steps (who, when, comment) → executed or rejected.
export function EntityHistoryDialog({ entity, onClose }: EntityHistoryDialogProps) {
    const { t, i18n } = useTranslation();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { data, isPending, isError } = useEntityHistory(entity);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    // showModal() gives focus trapping, Escape to close and focus return for free.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (entity && dialog && !dialog.open) dialog.showModal();
    }, [entity]);

    if (!entity) return null;

    const entityLabel = t(`auditLog.entityTypes.${entity.entityType}`, {
        id: entity.entityId,
        defaultValue: `${entity.entityType} #${entity.entityId}`,
    });

    // The API returns newest first; a timeline reads more naturally oldest first.
    const events = [...(data?.items ?? [])].reverse();

    return (
        <dialog
            ref={dialogRef}
            className={styles.historyDialog}
            aria-labelledby="entity-history-title"
            onClose={onClose}
        >
            <div className={styles.historyHeader}>
                <div>
                    <h2 id="entity-history-title">
                        {t("auditLog.history.title", { entity: entityLabel })}
                    </h2>
                    <p>{t("auditLog.history.description")}</p>
                </div>

                <button
                    type="button"
                    className={styles.historyClose}
                    onClick={() => dialogRef.current?.close()}
                    aria-label={t("common.close")}
                >
                    ×
                </button>
            </div>

            {isPending ? (
                <p role="status">{t("auditLog.history.loading")}</p>
            ) : isError ? (
                <p role="alert">{t("auditLog.history.error")}</p>
            ) : events.length === 0 ? (
                <p>{t("auditLog.history.empty")}</p>
            ) : (
                <ol className={styles.timeline}>
                    {events.map((event) => {
                        const kind = actionKind(event.action);
                        const { step, totalSteps, comment } = readDecisionDetails(event.details);

                        return (
                            <li key={event.id} className={styles.timelineItem}>
                                <span
                                    className={`${styles.timelineMarker} ${styles[`marker-${kind}`]}`}
                                    aria-hidden="true"
                                >
                                    {KIND_ICON[kind]}
                                </span>

                                <div className={styles.timelineBody}>
                                    <p className={styles.timelineTitle}>
                                        <strong>
                                            {t(`auditLog.actions.${event.action}`, {
                                                defaultValue: event.action,
                                            })}
                                        </strong>{" "}
                                        {t("auditLog.history.by", { user: event.userName })}
                                    </p>

                                    <time className={styles.timelineTime} dateTime={event.timeStamp}>
                                        {formatTimestamp(event.timeStamp, locale)}
                                    </time>

                                    <p className={styles.timelineDescription}>{event.description}</p>

                                    {step !== null && totalSteps !== null && (
                                        <span className={styles.detail}>
                                            {t("auditLog.details.step", { step, total: totalSteps })}
                                        </span>
                                    )}

                                    {comment && (
                                        <span className={styles.comment}>
                                            <span className={styles.visuallyHidden}>
                                                {t("auditLog.details.comment")}:{" "}
                                            </span>
                                            “{comment}”
                                        </span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </dialog>
    );
}
