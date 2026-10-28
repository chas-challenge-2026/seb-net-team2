import { Fragment, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";

import type { Account, Payment } from "../../services/accountService";
import styles from "./PaymentsTable.module.css";

type PaymentStatus = Payment["status"];
type StatusFilter = "all" | PaymentStatus;

const statusConfig: Record<PaymentStatus, {
    label: string;
    description: string;
    className: string;
    Icon: LucideIcon;
}> = {
    Completed: {
        label: "dashboard.status.completed",
        description: "dashboard.statusDescription.completed",
        className: styles.statusCompleted,
        Icon: CircleCheck,
    },
    "Pending approval": {
        label: "dashboard.status.pending",
        description: "dashboard.statusDescription.pending",
        className: styles.statusPending,
        Icon: Clock,
    },
    Rejected: {
        label: "dashboard.status.rejected",
        description: "dashboard.statusDescription.rejected",
        className: styles.statusRejected,
        Icon: CircleX,
    },
};

const statuses = Object.keys(statusConfig) as PaymentStatus[];
const filters: StatusFilter[] = ["all", ...statuses];
const COLUMN_COUNT = 7;

type PaymentsTableProps = {
    payments: Payment[];
    accounts: Account[];
    locale: string;
};

export function PaymentsTable({ payments, accounts, locale }: PaymentsTableProps) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const counts = statuses.reduce<Record<PaymentStatus, number>>(
        (result, status) => ({ ...result, [status]: payments.filter((payment) => payment.status === status).length }),
        { Completed: 0, "Pending approval": 0, Rejected: 0 },
    );
    const visiblePayments = filter === "all"
        ? payments
        : payments.filter((payment) => payment.status === filter);

    const accountName = (accountId: string) => accounts.find((account) => account.id === accountId)?.name ?? "—";
    const formatAmount = (payment: Payment) =>
        `${payment.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} ${payment.currency}`;

    function selectFilter(next: StatusFilter) {
        setFilter(next);
        setExpandedId(null);
    }

    function toggleDetails(id: string) {
        setExpandedId((current) => (current === id ? null : id));
    }

    function handleRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
        if (window.getSelection()?.toString()) return;
        if (event.defaultPrevented) return;
        toggleDetails(id);
    }

    function renderStatus(status: PaymentStatus) {
        const { label, className, Icon } = statusConfig[status];

        return (
            <span className={`${styles.status} ${className}`}>
                <Icon size={14} aria-hidden="true" />
                {t(label)}
            </span>
        );
    }

    return (
        <>
            <div className={styles.filters} role="group" aria-label={t("dashboard.filters.label")}>
                {filters.map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={`${styles.filter} ${filter === option ? styles.filterActive : ""}`}
                        aria-pressed={filter === option}
                        onClick={() => selectFilter(option)}
                    >
                        {option === "all" ? t("dashboard.filters.all") : t(statusConfig[option].label)}
                        <span className={styles.filterCount}>
                            {option === "all" ? payments.length : counts[option]}
                        </span>
                    </button>
                ))}
            </div>

            {visiblePayments.length === 0 ? (
                <p className={styles.empty}>{t("dashboard.table.empty")}</p>
            ) : (
                <div className={styles.tableScroll} role="region" aria-label={t("dashboard.recentPayments")} tabIndex={0}>
                    <table className={styles.paymentsTable}>
                        <thead>
                            <tr>
                                <th scope="col">{t("dashboard.table.date")}</th>
                                <th scope="col">{t("dashboard.table.fromAccount")}</th>
                                <th scope="col">{t("dashboard.table.recipientIban")}</th>
                                <th scope="col">{t("dashboard.table.reference")}</th>
                                <th scope="col">{t("dashboard.table.amount")}</th>
                                <th scope="col">{t("dashboard.table.status")}</th>
                                <th scope="col"><span className="visually-hidden">{t("dashboard.table.details")}</span></th>
                            </tr>
                        </thead>

                        <tbody>
                            {visiblePayments.map((payment) => {
                                const expanded = expandedId === payment.id;
                                const detailsId = `payment-details-${payment.id}`;
                                const config = statusConfig[payment.status];

                                return (
                                    <Fragment key={payment.id}>
                                        <tr
                                            className={`${styles.row} ${expanded ? styles.rowExpanded : ""}`}
                                            onClick={(event) => handleRowClick(event, payment.id)}
                                        >
                                            <td>{payment.date}</td>
                                            <td>{accountName(payment.fromAccountId)}</td>
                                            <td>{payment.toIban}</td>
                                            <td>{payment.reference}</td>
                                            <td>{formatAmount(payment)}</td>
                                            <td>{renderStatus(payment.status)}</td>
                                            <td className={styles.toggleCell}>
                                                <button
                                                    type="button"
                                                    className={styles.toggle}
                                                    aria-expanded={expanded}
                                                    aria-controls={expanded ? detailsId : undefined}
                                                    aria-label={t("dashboard.table.toggleDetails", {
                                                        date: payment.date,
                                                        amount: formatAmount(payment),
                                                    })}
                                                >
                                                    <ChevronDown size={18} aria-hidden="true" />
                                                </button>
                                            </td>
                                        </tr>

                                        {expanded && (
                                            <tr id={detailsId} className={styles.detailsRow}>
                                                <td colSpan={COLUMN_COUNT}>
                                                    <p className={`${styles.statusDescription} ${config.className}`}>
                                                        <config.Icon size={18} aria-hidden="true" />
                                                        {t(config.description)}
                                                    </p>

                                                    <dl className={styles.detailsList}>
                                                        <div>
                                                            <dt>{t("dashboard.table.fromAccount")}</dt>
                                                            <dd>{accountName(payment.fromAccountId)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{t("dashboard.table.recipientIban")}</dt>
                                                            <dd>{payment.toIban}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{t("dashboard.table.amount")}</dt>
                                                            <dd>{formatAmount(payment)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{t("dashboard.table.reference")}</dt>
                                                            <dd>{payment.reference || "—"}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{t("dashboard.table.date")}</dt>
                                                            <dd>{payment.date}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>{t("dashboard.table.paymentId")}</dt>
                                                            <dd>{payment.id}</dd>
                                                        </div>
                                                    </dl>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
