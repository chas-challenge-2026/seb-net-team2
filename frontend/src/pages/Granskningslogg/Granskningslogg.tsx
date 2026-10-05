import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronsDown, Info, RotateCcw, ScrollText } from "lucide-react";

import Card from "../../components/Card/Card";
import { useAuditLog } from "../../hooks/useAuditLog";

import styles from "./Granskningslogg.module.css";

const ALL_USERS = "all";
const ALL_EVENTS = "all";
const PAGE_SIZE = 5;

function formatTimestamp(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleString(locale, {
        dateStyle: "short",
        timeStyle: "short",
    });
}

export function Granskningslogg() {
    const { t, i18n } = useTranslation();
    const { data: entries, isLoading, isError } = useAuditLog();

    const [userFilter, setUserFilter] = useState(ALL_USERS);
    const [eventFilter, setEventFilter] = useState(ALL_EVENTS);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const users = useMemo(
        () => [...new Set((entries ?? []).map((entry) => entry.user))].sort(),
        [entries]
    );

    const events = useMemo(
        () => [...new Set((entries ?? []).map((entry) => entry.action))].sort(),
        [entries]
    );

    const filteredEntries = useMemo(() => {
        return (entries ?? []).filter((entry) => {
            const entryDate = entry.timestamp.slice(0, 10);

            if (userFilter !== ALL_USERS && entry.user !== userFilter) return false;
            if (eventFilter !== ALL_EVENTS && entry.action !== eventFilter) return false;
            if (dateFrom && entryDate < dateFrom) return false;
            if (dateTo && entryDate > dateTo) return false;

            return true;
        });
    }, [entries, userFilter, eventFilter, dateFrom, dateTo]);

    const hasActiveFilters =
        userFilter !== ALL_USERS ||
        eventFilter !== ALL_EVENTS ||
        dateFrom !== "" ||
        dateTo !== "";

    function updateUserFilter(value: string) {
        setUserFilter(value);
        setVisibleCount(PAGE_SIZE);
    }

    function updateEventFilter(value: string) {
        setEventFilter(value);
        setVisibleCount(PAGE_SIZE);
    }

    function updateDateFrom(value: string) {
        setDateFrom(value);
        setVisibleCount(PAGE_SIZE);
    }

    function updateDateTo(value: string) {
        setDateTo(value);
        setVisibleCount(PAGE_SIZE);
    }

    function resetFilters() {
        setUserFilter(ALL_USERS);
        setEventFilter(ALL_EVENTS);
        setDateFrom("");
        setDateTo("");
        setVisibleCount(PAGE_SIZE);
    }

    const visibleEntries = filteredEntries.slice(0, visibleCount);
    const hasMore = visibleCount < filteredEntries.length;

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
                <div className={styles.infoBanner}>
                    <Info size={18} aria-hidden="true" />
                    <span>
                        <strong>{t("auditLog.note.title")}</strong>{" "}
                        {t("auditLog.note.description")}{" "}
                        <code>/tmp/audit.log</code>{" "}
                        {t("auditLog.note.descriptionEnd")}
                    </span>
                </div>

                {entries && entries.length > 0 && (
                    <div className={styles.toolbar}>
                        <div className={styles.filterField}>
                            <label htmlFor="audit-user-filter">{t("auditLog.filters.user")}</label>

                            <select
                                id="audit-user-filter"
                                value={userFilter}
                                onChange={(event) => updateUserFilter(event.target.value)}
                            >
                                <option value={ALL_USERS}>{t("auditLog.filters.allUsers")}</option>

                                {users.map((user) => (
                                    <option key={user} value={user}>{user}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterField}>
                            <label htmlFor="audit-event-filter">{t("auditLog.filters.eventType")}</label>

                            <select
                                id="audit-event-filter"
                                value={eventFilter}
                                onChange={(event) => updateEventFilter(event.target.value)}
                            >
                                <option value={ALL_EVENTS}>{t("auditLog.filters.allEvents")}</option>

                                {events.map((action) => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterField}>
                            <label htmlFor="audit-date-from">{t("auditLog.filters.fromDate")}</label>

                            <input
                                id="audit-date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(event) => updateDateFrom(event.target.value)}
                            />
                        </div>

                        <div className={styles.filterField}>
                            <label htmlFor="audit-date-to">{t("auditLog.filters.toDate")}</label>

                            <input
                                id="audit-date-to"
                                type="date"
                                value={dateTo}
                                onChange={(event) => updateDateTo(event.target.value)}
                            />
                        </div>

                        {hasActiveFilters && (
                            <button type="button" className={styles.resetButton} onClick={resetFilters}>
                                <RotateCcw size={16} aria-hidden="true" />
                                {t("auditLog.filters.clear")}
                            </button>
                        )}
                    </div>
                )}

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
                            {isLoading ? (
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
                            ) : visibleEntries.length > 0 ? (
                                visibleEntries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{formatTimestamp(entry.timestamp, locale)}</td>
                                        <td>{entry.user}</td>
                                        <td>
                                            <code className={styles.actionCode}>{entry.action}</code>
                                        </td>
                                        <td>{entry.entityType} #{entry.entityId}</td>
                                        <td>{entry.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className={styles.statusRow} colSpan={5}>
                                        {entries && entries.length > 0
                                            ? t("auditLog.states.noMatches")
                                            : t("auditLog.states.empty")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && !isError && filteredEntries.length > 0 && (
                    <div className={styles.pagination}>
                        <span className={styles.paginationCount}>
                            {t("auditLog.pagination.showing", {
                                visible: visibleEntries.length,
                                total: filteredEntries.length,
                            })}
                        </span>

                        {hasMore && (
                            <button
                                type="button"
                                className={styles.showMoreButton}
                                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                            >
                                {t("auditLog.pagination.showMore")}
                                <ChevronsDown size={16} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                )}
            </Card>

            <p className={styles.footnote}>
                {t("auditLog.footnote.start")} <code>/tmp/audit.log</code> {t("auditLog.footnote.end")}
            </p>
        </section>
    );
}