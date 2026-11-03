import { useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
    ChevronDown,
    CircleCheck,
    CircleX,
    History,
    RotateCcw,
    SlidersHorizontal,
} from "lucide-react";

import { isHistoryUnavailable } from "../../hooks/useApprovalHistory";
import { useHandledHistory } from "../../hooks/useAdminDecisionHistory";
import { useAuth } from "../../hooks/useAuth";
import { useSessionDecisions } from "../../hooks/useSessionDecisions";
import { historyEntryDate, type DecidedApproval } from "../../schemas/approvalHistorySchema";
import { formatIban, recipientBank } from "../../utils/paymentChecks";

import { ApprovalListSkeleton } from "./ApprovalListSkeleton";
import styles from "./Attestkorg.module.css";

type StatusFilter = "all" | "approved" | "rejected";

// Search and filters appear only when there are more decisions than this.
const FILTERS_FROM_COUNT = 5;

function formatAmount(entry: DecidedApproval, locale: string): string {
    return `${entry.amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${entry.currency}`;
}

function formatDate(date: string, locale: string): string {
    return new Date(date).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

type MonthGroup = { key: string; label: string; entries: DecidedApproval[] };

// Splits an already sorted list into "October 2026", "September 2026", ...
function groupByMonth(entries: DecidedApproval[], locale: string, unknownLabel: string): MonthGroup[] {
    const groups: MonthGroup[] = [];

    for (const entry of entries) {
        const date = historyEntryDate(entry);
        const key = date ? date.slice(0, 7) : "unknown";
        const last = groups[groups.length - 1];

        if (last?.key === key) {
            last.entries.push(entry);
            continue;
        }

        const month = date
            ? new Date(date).toLocaleDateString(locale, { month: "long", year: "numeric" })
            : unknownLabel;
        // Swedish month names are lowercase ("oktober 2026"), but this is a heading.
        groups.push({ key, label: month.charAt(0).toUpperCase() + month.slice(1), entries: [entry] });
    }

    return groups;
}

// The attestant's earlier decisions, so the inbox stays useful after everything is handled:
// "what did I approve last month, and why did I reject that one?"
export function HandledApprovals({ id, labelledBy }: { id: string; labelledBy: string }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const { user } = useAuth();
    const { data: apiHistory = [], isPending, isError, error } = useHandledHistory(user);
    const sessionDecisions = useSessionDecisions(user?.id);

    // Until the backend has a history endpoint, show the decisions made since the page was opened.
    const usingSession = isError && isHistoryUnavailable(error);
    const history = usingSession ? sessionDecisions : apiHistory;

    const [search, setSearch] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");

    const [filtersOpen, setFiltersOpen] = useState(false);

    const showFilters = history.length > FILTERS_FROM_COUNT;

    const hasActiveFilters =
        search !== "" || status !== "all" || dateFrom !== "" || dateTo !== "" ||
        minAmount !== "" || maxAmount !== "";

    // The decision filter is only useful once the backend sends the decision.
    const hasDecisions = history.some((entry) => entry.decision !== undefined);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        const min = minAmount === "" ? null : Number(minAmount);
        const max = maxAmount === "" ? null : Number(maxAmount);

        return history
            .filter((entry) => {
                const decidedDate = historyEntryDate(entry).slice(0, 10);

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
            .sort((a, b) => historyEntryDate(b).localeCompare(historyEntryDate(a)));
    }, [history, search, status, dateFrom, dateTo, minAmount, maxAmount]);

    function resetFilters() {
        setSearch("");
        setStatus("all");
        setDateFrom("");
        setDateTo("");
        setMinAmount("");
        setMaxAmount("");
        // The "Clear" button disappears once nothing is filtered, so focus moves to the search field
        // instead of falling back to the top of the page.
        searchRef.current?.focus();
    }

    if (isPending) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0} className={styles.tabPanel}>
                <ApprovalListSkeleton label={t("approvalInbox.history.loading")} />
            </div>
        );
    }

    if (isError && !usingSession) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0} className={styles.tabPanel}>
                <div className={styles.error} role="alert">
                    {t("approvalInbox.history.error")}
                </div>
            </div>
        );
    }

    if (usingSession && sessionDecisions.length === 0) {
        return (
            <div id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0} className={styles.tabPanel}>
                <div className={styles.emptyState}>
                    <History size={32} aria-hidden="true" />
                    <h2>{t("approvalInbox.history.unavailableTitle")}</h2>
                    <p>{t("approvalInbox.history.sessionEmpty")}</p>
                </div>
            </div>
        );
    }

    return (
        <div id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0} className={styles.tabPanel}>
            {/* With only a few decisions the list is easy to scan, so filters would just be in the way. */}
            {showFilters && (
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="history-search">{t("approvalInbox.history.search")}</label>
                        <input
                            id="history-search"
                            ref={searchRef}
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("approvalInbox.history.searchPlaceholder")}
                        />
                    </div>

                    <button
                        type="button"
                        className={styles.filterToggle}
                        aria-expanded={filtersOpen}
                        aria-controls="history-more-filters"
                        onClick={() => setFiltersOpen((open) => !open)}
                    >
                        <SlidersHorizontal size={16} aria-hidden="true" />
                        {t("approvalInbox.history.moreFilters")}
                        <ChevronDown
                            data-disclosure-chevron
                            size={16}
                            aria-hidden="true"
                        />
                    </button>

                    {hasActiveFilters && (
                        <button type="button" className={styles.resetFilters} onClick={resetFilters}>
                            <RotateCcw size={16} aria-hidden="true" />
                            {t("approvalInbox.history.clear")}
                        </button>
                    )}
                </div>
            )}

            {showFilters && filtersOpen && (
                <div id="history-more-filters" className={styles.toolbar}>
                    {hasDecisions && (
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
                    )}

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

                    {/* One "Amount: from – to" group instead of two separate fields that wrap onto a new row. */}
                    <fieldset className={styles.amountRange}>
                        <legend>{t("approvalInbox.history.amount")}</legend>
                        <div className={styles.amountInputs}>
                            <input
                                type="number"
                                min={0}
                                inputMode="decimal"
                                value={minAmount}
                                onChange={(event) => setMinAmount(event.target.value)}
                                placeholder={t("approvalInbox.history.amountFrom")}
                                aria-label={t("approvalInbox.history.minAmount")}
                            />
                            <span aria-hidden="true">–</span>
                            <input
                                type="number"
                                min={0}
                                inputMode="decimal"
                                value={maxAmount}
                                onChange={(event) => setMaxAmount(event.target.value)}
                                placeholder={t("approvalInbox.history.amountTo")}
                                aria-label={t("approvalInbox.history.maxAmount")}
                            />
                        </div>
                    </fieldset>
                </div>
            )}

            {/* The live region is always there, so screen readers also announce the first count.
                The count itself is only meaningful when the filters actually hide something. */}
            <div aria-live="polite">
                {hasActiveFilters && (
                    <p className={styles.historyCount}>
                        {t("approvalInbox.history.count", { visible: filtered.length, total: history.length })}
                    </p>
                )}
            </div>

            {filtered.length > 0 ? (
                <div className={styles.historyGroups}>
                    {/* Grouped by month so a long history stays easy to scan. */}
                    {groupByMonth(filtered, locale, t("approvalInbox.history.unknownDate")).map((group) => (
                        <section key={group.key} aria-labelledby={`history-month-${group.key}`}>
                            <h2 id={`history-month-${group.key}`} className={styles.historyMonth}>
                                {group.label}
                            </h2>

                            <ul className={styles.historyList}>
                                {group.entries.map((entry) => {
                                    const approved = entry.decision === "approved";
                                    const bank = recipientBank(entry.toIban);
                                    // Same top line as the cards under "To handle": step, and dual approval from step 2.
                                    const step = (
                                        <>
                                            {t("approvalInbox.card.approvalStep", { step: entry.stepNumber })}
                                            {entry.stepNumber > 1 && (
                                                <>
                                                    {" · "}
                                                    <span className={styles.dualApproval}>
                                                        {t("approvalInbox.card.dualApprovalShort")}
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    );

                                    return (
                                        <li key={entry.stepId} className={styles.historyItem}>
                                            <div className={styles.historyItemHeader}>
                                                <div>
                                                    {entry.decision ? (
                                                        <p
                                                            className={approved ? styles.decisionApproved : styles.decisionRejected}
                                                        >
                                                            {approved ? (
                                                                <CircleCheck size={16} aria-hidden="true" />
                                                            ) : (
                                                                <CircleX size={16} aria-hidden="true" />
                                                            )}
                                                            <Trans
                                                                i18nKey={approved
                                                                    ? "approvalInbox.history.approvedOn"
                                                                    : "approvalInbox.history.rejectedOn"}
                                                                values={{ date: entry.decidedAt ? formatDate(entry.decidedAt, locale) : "" }}
                                                                components={{ time: <time dateTime={entry.decidedAt ?? undefined} /> }}
                                                            />
                                                            {" · "}
                                                            {step}
                                                        </p>
                                                    ) : (
                                                        // The backend doesn't send the decision yet; the tab already says "Handled".
                                                        <p className={styles.decisionHandled}>{step}</p>
                                                    )}
                                                    <h3>
                                                        <span className={styles.referenceLabel}>
                                                            {t("approvalInbox.card.reference")}
                                                        </span>{" "}
                                                        {entry.reference}
                                                    </h3>
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
                                                    <dd>
                                                        {entry.createdByUserName}
                                                        {entry.paymentCreatedAt && (
                                                            <>
                                                                {" · "}
                                                                <time dateTime={entry.paymentCreatedAt}>
                                                                    {formatDate(entry.paymentCreatedAt, locale)}
                                                                </time>
                                                            </>
                                                        )}
                                                    </dd>
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
                        </section>
                    ))}
                </div>
            ) : (
                <div className={`${styles.emptyState} ${history.length === 0 ? styles.handledEmpty : ""}`}>
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
