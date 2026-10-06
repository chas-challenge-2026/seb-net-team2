import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CreditCard, Landmark, ReceiptText } from "lucide-react";

import { useAccounts } from "../../hooks/useAccounts";
import { usePayments } from "../../hooks/usePayments";
import { useAuth } from "../../hooks/useAuth";

import Card from "../../components/Card/Card";

import styles from "./Dashboard.module.css";

export function Dashboard() {
    const { t, i18n } = useTranslation();
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts();
    const { data: payments, isLoading: loadingPayments } = usePayments();
    const { user } = useAuth();

    const firstName = user?.name.trim().split(/\s+/)[0] || t("dashboard.user");
    const today = new Date();
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-GB";

    const formattedDate = new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(today);

    const dateTime = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <div>
                    <h1>{t("dashboard.greeting", { user: firstName })}</h1>

                    <p>
                        {user?.tenantName && (
                            <>
                                {user.tenantName} <span aria-hidden="true">·</span>{" "}
                            </>
                        )}

                        <time dateTime={dateTime}>{formattedDate}</time>
                    </p>
                </div>

                <Link to="/ny-betalning" className={styles.createPaymentLink}>
                    <CreditCard size={18} strokeWidth={2} aria-hidden="true" />
                    <span>{t("dashboard.createPayment")}</span>
                </Link>
            </header>

            <section>
                <h2 className={styles.sectionTitle}>
                    <Landmark size={20} strokeWidth={2} aria-hidden="true" />
                    {t("dashboard.accounts")}
                </h2>

                {loadingAccounts ? (
                    <p>{t("common.loading")}</p>
                ) : accountsError ? (
                    <p role="alert">{t("dashboard.errors.accounts")}</p>
                ) : accounts?.length === 0 ? (
                    <p>{t("dashboard.accountsEmpty")}</p>
                ) : (
                    <div className={styles.accountsGrid}>
                        {accounts?.map((account) => (
                            <Card key={account.id}
                                variant="secondary"
                            >
                                <p className={styles.accountName}>{account.name}</p>

                                <p className={styles.accountBalance}>
                                    {account.balance.toLocaleString(locale, {
                                        minimumFractionDigits: 2,
                                    })}{" "}
                                    {account.currency}
                                </p>

                                <p className={styles.accountIban}>{account.iban}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <section className={styles.recentPayments}>
                <h2 className={styles.sectionTitle}>
                    <ReceiptText size={20} strokeWidth={2} aria-hidden="true" />
                    {t("dashboard.recentPayments")}
                </h2>

                <Card
                >
                    {loadingPayments ? (
                        <p>{t("common.loading")}</p>
                    ) : (
                        <table className={styles.paymentsTable}>
                            <thead>
                                <tr>
                                    <th>{t("dashboard.table.date")}</th>
                                    <th>{t("dashboard.table.recipientIban")}</th>
                                    <th>{t("dashboard.table.reference")}</th>
                                    <th>{t("dashboard.table.amount")}</th>
                                    <th>{t("dashboard.table.status")}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {payments?.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>{payment.date}</td>
                                        <td>{payment.toIban}</td>
                                        <td>{payment.reference}</td>

                                        <td>
                                            {payment.amount.toLocaleString(locale, {
                                                minimumFractionDigits: 2,
                                            })}{" "}
                                            {payment.currency}
                                        </td>

                                        <td>
                                            <span
                                                className={`${styles.status} ${styles[
                                                    payment.status === "Completed"
                                                        ? "status--done"
                                                        : "status--pending"
                                                ]
                                                    }`}
                                            >
                                                {payment.status === "Completed"
                                                    ? t("dashboard.status.completed")
                                                    : payment.status === "Pending approval"
                                                        ? t("dashboard.status.pending")
                                                        : payment.status === "Rejected"
                                                            ? t("dashboard.status.rejected")
                                                            : payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </section>
        </div>
    );
}