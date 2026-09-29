import { useTranslation } from "react-i18next";

import { useAccounts } from "../../hooks/useAccounts";
import { usePayments } from "../../hooks/usePayments";
import { useAuth } from "../../hooks/useAuth";

import styles from "./Dashboard.module.css";

export function Dashboard() {
    const { t, i18n } = useTranslation();
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts();
    const { data: payments, isLoading: loadingPayments } = usePayments();
    const { user } = useAuth();

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    if (accountsError) return <p>{t("dashboard.errors.generic")}</p>;

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <h1>{t("dashboard.welcome", { user: user?.email ?? t("dashboard.user") })}</h1>
                <p>{t("dashboard.companyName")}</p>
            </header>

            <section>
                <h2>{t("dashboard.accounts")}</h2>

                {loadingAccounts ? <p>{t("common.loading")}</p> : (
                    <div className={styles["accounts-grid"]}>
                        {accounts?.map((account) => (
                            <div key={account.id} className={styles["account-card"]}>
                                <p className={styles["account-card__name"]}>{account.name}</p>
                                <p className={styles["account-card__balance"]}>
                                    {account.balance.toLocaleString(locale, { minimumFractionDigits: 2 })} {account.currency}
                                </p>
                                <p className={styles["account-card__iban"]}>{account.iban}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className={styles["dashboard__bottom"]}>
                <section>
                    <h2>{t("dashboard.recentPayments")}</h2>

                    {loadingPayments ? <p>{t("common.loading")}</p> : (
                        <table>
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
                                            {payment.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {payment.currency}
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${styles[payment.status === "Completed" ? "status--done" : "status--pending"]}`}>
                                                {payment.status === "Completed"
                                                    ? t("dashboard.status.completed")
                                                    : payment.status === "Pending approval"
                                                        ? t("dashboard.status.pending")
                                                        : payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
}