import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronsDown, RotateCcw, ScrollText } from "lucide-react";

import Card from "../../components/Card/Card";
import { useAuditLog, type AuditEntityRef } from "../../hooks/useAuditLog";
import { AUDIT_ACTIONS, type AuditLogFilters } from "../../services/auditService";
import { getAllUsers } from "../../services/authService";

import { EntityHistoryDialog } from "./EntityHistoryDialog";
import { actionKind, formatTimestamp, readDecisionDetails } from "./auditFormat";
import styles from "./Granskningslogg.module.css";

const ALL_USERS = "all";
const ALL_EVENTS = "all";

export function Granskningslogg() {
    const { t, i18n } = useTranslation();

    const [historyEntity, setHistoryEntity] = useState<AuditEntityRef | null>(null);

    function actionLabel(action: string) {
        return t(`auditLog.actions.${action}`, { defaultValue: action });
    }

    function entityLabel(entityType: string, entityId: number) {
        return t(`auditLog.entityTypes.${entityType}`, {
            id: entityId,
            defaultValue: `${entityType} #${entityId}`,
        });
    }

    const [userFilter, setUserFilter] = useState(ALL_USERS);
    const [eventFilter, setEventFilter] = useState(ALL_EVENTS);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filters = useMemo<AuditLogFilters>(
        () => ({
            userId: userFilter === ALL_USERS ? undefined : Number(userFilter),
            action: eventFilter === ALL_EVENTS ? undefined : eventFilter,
            from: dateFrom || undefined,
            to: dateTo || undefined,
        }),
        [userFilter, eventFilter, dateFrom, dateTo]
    );

    const {
        data,
        isPending,
        isError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useAuditLog(filters);

    // Same query key as the admin user pages, so the list is shared from the cache.
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: getAllUsers,
    });

    const sortedUsers = useMemo(
        () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
        [users]
    );

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const entries = data?.pages.flatMap((page) => page.items) ?? [];
    const totalCount = data?.pages[data.pages.length - 1]?.totalCount ?? 0;

    const hasActiveFilters =
        userFilter !== ALL_USERS ||
        eventFilter !== ALL_EVENTS ||
        dateFrom !== "" ||
        dateTo !== "";

    function resetFilters() {
        setUserFilter(ALL_USERS);
        setEventFilter(ALL_EVENTS);
        setDateFrom("");
        setDateTo("");
    }

    return (
        <section className={styles.page} aria-labelledby="audit-log-title">
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <ScrollText size={24} strokeWidth={2} aria-hidden="true" />
                    <h1 id="audit-log-title">{t("auditLog.title")}</h1>
                </div>
                <p className={styles.intro}>{t("auditLog.description")}</p>
            </header>

            <Card>
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="audit-user-filter">{t("auditLog.filters.user")}</label>

                        <select
                            id="audit-user-filter"
                            value={userFilter}
                            onChange={(event) => setUserFilter(event.target.value)}
                        >
                            <option value={ALL_USERS}>{t("auditLog.filters.allUsers")}</option>

                            {sortedUsers.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="audit-event-filter">{t("auditLog.filters.eventType")}</label>

                        <select
                            id="audit-event-filter"
                            value={eventFilter}
                            onChange={(event) => setEventFilter(event.target.value)}
                        >
                            <option value={ALL_EVENTS}>{t("auditLog.filters.allEvents")}</option>

                            {AUDIT_ACTIONS.map((action) => (
                                <option key={action} value={action}>{actionLabel(action)}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="audit-date-from">{t("auditLog.filters.fromDate")}</label>

                        <input
                            id="audit-date-from"
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(event) => setDateFrom(event.target.value)}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="audit-date-to">{t("auditLog.filters.toDate")}</label>

                        <input
                            id="audit-date-to"
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(event) => setDateTo(event.target.value)}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button type="button" className={styles.resetButton} onClick={resetFilters}>
                            <RotateCcw size={16} aria-hidden="true" />
                            {t("auditLog.filters.clear")}
                        </button>
                    )}
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <caption className={styles.visuallyHidden}>
                            {t("auditLog.table.caption")}
                        </caption>

                        <thead>
                            <tr>
                                <th scope="col">{t("auditLog.table.timestamp")}</th>
                                <th scope="col">{t("auditLog.table.user")}</th>
                                <th scope="col">{t("auditLog.table.event")}</th>
                                <th scope="col">{t("auditLog.table.entity")}</th>
                                <th scope="col">{t("auditLog.table.description")}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isPending ? (
                                <tr>
                                    <td className={styles.statusRow} colSpan={5} role="status" aria-live="polite">
                                        {t("auditLog.states.loading")}
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td className={styles.statusRow} colSpan={5} role="alert">
                                        {t("auditLog.states.error")}
                                    </td>
                                </tr>
                            ) : entries.length > 0 ? (
                                entries.map((entry) => {
                                    const { step, totalSteps, comment } = readDecisionDetails(entry.details);

                                    return (
                                        <tr key={entry.id}>
                                            <td>{formatTimestamp(entry.timeStamp, locale)}</td>
                                            <td>{entry.userName}</td>
                                            <td>
                                                <span
                                                    className={`${styles.actionLabel} ${styles[`action-${actionKind(entry.action)}`]}`}
                                                >
                                                    {actionLabel(entry.action)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.entityButton}
                                                    onClick={() =>
                                                        setHistoryEntity({
                                                            entityType: entry.entityType,
                                                            entityId: entry.entityId,
                                                        })
                                                    }
                                                    aria-label={t("auditLog.history.showHistory", {
                                                        entity: entityLabel(entry.entityType, entry.entityId),
                                                    })}
                                                >
                                                    {entityLabel(entry.entityType, entry.entityId)}
                                                </button>
                                            </td>
                                            <td>
                                                {entry.description}

                                                {step !== null && totalSteps !== null && (
                                                    <span className={styles.detail}>
                                                        {t("auditLog.details.step", {
                                                            step,
                                                            total: totalSteps,
                                                        })}
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
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td className={styles.statusRow} colSpan={5}>
                                        {hasActiveFilters
                                            ? t("auditLog.states.noMatches")
                                            : t("auditLog.states.empty")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!isPending && !isError && entries.length > 0 && (
                    <div className={styles.pagination}>
                        <span className={styles.paginationCount} aria-live="polite">
                            {t("auditLog.pagination.showing", {
                                visible: entries.length,
                                total: totalCount,
                            })}
                        </span>

                        {hasNextPage && (
                            <button
                                type="button"
                                className={styles.showMoreButton}
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage
                                    ? t("common.loading")
                                    : t("auditLog.pagination.showMore")}
                                {!isFetchingNextPage && <ChevronsDown size={16} aria-hidden="true" />}
                            </button>
                        )}
                    </div>
                )}
            </Card>

            <EntityHistoryDialog
                entity={historyEntity}
                onClose={() => setHistoryEntity(null)}
            />
        </section>
    );
}
