import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, CircleX, History, Info, RotateCcw } from "lucide-react";

import { isHistoryUnavailable, useApprovalHistory } from "../../hooks/useApprovalHistory";
import { useAuth } from "../../hooks/useAuth";
import { useSessionDecisions } from "../../hooks/useSessionDecisions";
import type { DecidedApproval } from "../../schemas/approvalHistorySchema";
import { formatIban, recipientBank } from "../../utils/paymentChecks";

import styles from "./Attestkorg.module.css";

type StatusFilter = "all" | "approved" | "rejected";

function formatAmount(entry: DecidedApproval, locale: string): string {
    return `${entry.amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${entry.currency}`;
}

function formatDate(date: string, locale: string): string {
    return new Date(date).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

// The attestant's earlier decisions, so the inbox stays useful after everything is handled:
// "what did I approve last month, and why did I reject that one?"
export function HandledApprovals({ id, labelledBy }: { id: string; labelledBy: string }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const { user } = useAuth();
    const { data: apiHistory = [], isPending, isError, error } = useApprovalHistory(true);
    const sessionDecisions = useSessionDecisions(user?.id);

    // Until the backend has a history endpoint, show the decisions made since the page was opened.
    const usingSession = isError && isHistoryUnavailable(error);
    const history = usingSession ? sessionDecisions : apiHistory;

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<StatusFilter>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");

    const hasActiveFilters =
        search !== "" || status !== "all" || dateFrom !== "" || dateTo !== "" ||
        minAmount !== "" || maxAmount !== "";

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        const min = minAmount === "" ? null : Number(minAmount);
        const max = maxAmount === "" ? null : Number(maxAmount);

        return history
            .filter((entry) => {
                const decidedDate = entry.decidedAt.slice(0, 10);

                if (status !== "all" && entry.decision !== status) return false;
                if (dateFrom && decidedDate < dateFrom) return false;
                if (dateTo && decidedDate > dateTo) return false;
                if (min !== null && entry.amount < min) return false;
                if (max !== null && entry.amount > max) return false;

                if (query) {
                    const searchable = [
                        entry.reference,
                        entry.recipientName ?? "",
                        entry.createdByUserName,
                        entry.comment ?? "",
                        String(entry.paymentId),
                    ].join(" ").toLowerCase();

                    // IBANs are compared without spaces, so "SE08 5000" and "SE085000" both match.
                    const ibanMatches = entry.toIban.replace(/\s/g, "").toLowerCase()
                        .includes(query.replace(/\s/g, ""));

                    if (!searchable.includes(query) && !ibanMatches) return false;
                }

                return true;
            })
            .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
    }, [history, search, status, dateFrom, dateTo, minAmount, maxAmount]);

    function resetFilters() {
        setSearch("");
        setStatus("all");
        setDateFrom("");
        setDateTo("");
        setMinAmount("");
        setMaxAmount("");
    }

    if (isPending) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy}>
                <div className={styles.loadingState} role="status">
                    {t("approvalInbox.history.loading")}
                </div>
            </div>
        );
    }

    if (isError && !usingSession) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy}>
                <div className={styles.error} role="alert">
                    {t("approvalInbox.history.error")}
                </div>
            </div>
        );
    }

    if (usingSession && sessionDecisions.length === 0) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy}>
                <div className={styles.emptyState}>
                    <History size={32} aria-hidden="true" />
                    <h2>{t("approvalInbox.history.unavailableTitle")}</h2>
                    <p>{t("approvalInbox.history.sessionEmpty")}</p>
                </div>
            </div>
        );
    }

    return (
        <div id={id} role="tabpanel" aria-labelledby={labelledBy}>
            {usingSession && (
                <p className={styles.sessionNote}>
                    <Info size={16} aria-hidden="true" />
                    {t("approvalInbox.history.sessionNote")}
                </p>
            )}

            {history.length > 0 && (
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="history-search">{t("approvalInbox.history.search")}</label>
                        <input
                            id="history-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("approvalInbox.history.searchPlaceholder")}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="history-status">{t("approvalInbox.history.status")}</label>
                        <select
                            id="history-status"
                            value={status}
                            onChange={(event) => setStatus(event.target.value as StatusFilter)}
                        >
                            <option value="all">{t("approvalInbox.history.statusAll")}</option>
                            <option value="approved">{t("approvalInbox.history.statusApproved")}</option>
                            <option value="rejected">{t("approvalInbox.history.statusRejected")}</option>
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="history-from">{t("approvalInbox.history.fromDate")}</label>
                        <input
                            id="history-from"
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(event) => setDateFrom(event.target.value)}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="history-to">{t("approvalInbox.history.toDate")}</label>
                        <input
                            id="history-to"
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(event) => setDateTo(event.target.value)}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="history-min">{t("approvalInbox.history.minAmount")}</label>
                        <input
                            id="history-min"
                            type="number"
                            min={0}
                            inputMode="decimal"
                            value={minAmount}
                            onChange={(event) => setMinAmount(event.target.value)}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <label htmlFor="history-max">{t("approvalInbox.history.maxAmount")}</label>
                        <input
                            id="history-max"
                            type="number"
                            min={0}
                            inputMode="decimal"
                            value={maxAmount}
                            onChange={(event) => setMaxAmount(event.target.value)}
                        />
                    </div>

                    {hasActiveFilters && (
                        <button type="button" className={styles.resetFilters} onClick={resetFilters}>
                            <RotateCcw size={16} aria-hidden="true" />
                            {t("approvalInbox.history.clear")}
                        </button>
                    )}
                </div>
            )}

            {history.length > 0 && (
                <p className={styles.historyCount} aria-live="polite">
                    {t("approvalInbox.history.count", { visible: filtered.length, total: history.length })}
                </p>
            )}

            {filtered.length > 0 ? (
                <ul className={styles.historyList}>
                    {filtered.map((entry) => {
                        const approved = entry.decision === "approved";
                        const bank = recipientBank(entry.toIban);

                        return (
                            <li key={entry.stepId} className={styles.historyItem}>
                                <div className={styles.historyItemHeader}>
                                    <div>
                                        <p
                                            className={approved ? styles.decisionApproved : styles.decisionRejected}
                                        >
                                            {approved ? (
                                                <CircleCheck size={16} aria-hidden="true" />
                                            ) : (
                                                <CircleX size={16} aria-hidden="true" />
                                            )}
                                            {t(approved
                                                ? "approvalInbox.history.approvedOn"
                                                : "approvalInbox.history.rejectedOn", {
                                                date: formatDate(entry.decidedAt, locale),
                                            })}
                                        </p>
                                        <h3>{entry.reference}</h3>
                                    </div>

                                    <strong>{formatAmount(entry, locale)}</strong>
                                </div>

                                <dl className={styles.historyDetails}>
                                    {entry.recipientName && (
                                        <div>
                                            <dt>{t("approvalInbox.card.recipient")}</dt>
                                            <dd>{entry.recipientName}</dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt>{t("approvalInbox.card.toIban")}</dt>
                                        <dd>{formatIban(entry.toIban)}{bank ? ` · ${bank}` : ""}</dd>
                                    </div>

                                    <div>
                                        <dt>{t("approvalInbox.card.submittedBy")}</dt>
                                        <dd>{entry.createdByUserName}</dd>
                                    </div>

                                    <div>
                                        <dt>{t("approvalInbox.history.step")}</dt>
                                        <dd>{entry.stepNumber}</dd>
                                    </div>
                                </dl>

                                {entry.comment?.trim() && (
                                    <p className={styles.historyComment}>
                                        {approved
                                            ? t("approvalInbox.comment.label")
                                            : t("approvalInbox.history.reason")}
                                        : “{entry.comment.trim()}”
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className={styles.emptyState}>
                    <History size={32} aria-hidden="true" />
                    <h2>
                        {history.length === 0
                            ? t("approvalInbox.history.emptyTitle")
                            : t("approvalInbox.history.noMatchesTitle")}
                    </h2>
                    <p>
                        {history.length === 0
                            ? t("approvalInbox.history.emptyDescription")
                            : t("approvalInbox.history.noMatchesDescription")}
                    </p>
                </div>
            )}
        </div>
    );
}
