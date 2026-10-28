import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Landmark, ReceiptText } from "lucide-react";

import { useAccounts } from "../../hooks/useAccounts";
import { usePayments } from "../../hooks/usePayments";
import { useAuth } from "../../hooks/useAuth";
import { useExchangeRates } from "../../hooks/useExchangeRates";
import { calculateAccountBalances } from "../../utils/accountBalances";
import { useCurrency } from "../../hooks/useCurrency";

import Card from "../../components/Card/Card";
import { CurrencySelector } from "../../components/CurrencySelector/CurrencySelector";
import { PaymentsTable } from "./PaymentsTable";

import styles from "./Dashboard.module.css";

export function Dashboard() {
    const { t, i18n } = useTranslation();
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts();
    const { data: payments, isLoading: loadingPayments } = usePayments();
    const { user } = useAuth();
    const { primaryCurrency } = useCurrency();
    const [copyMessage, setCopyMessage] = useState("");
    async function copyIban(iban: string) {
        try {
            await navigator.clipboard.writeText(iban);
            setCopyMessage(t("dashboard.currency.copied"));
        } catch {
            setCopyMessage(t("dashboard.currency.copyFailed"));
        }
    }
    const displayedAccounts = accounts ?? [];
    const rateQueries = useExchangeRates(displayedAccounts.map((account) => account.currency), primaryCurrency);
    const rates = rateQueries.flatMap((query) => query.data ? [query.data] : []);
    const balances = calculateAccountBalances(displayedAccounts, rates, primaryCurrency);
    const loadingRates = rateQueries.some((query) => query.isPending);

    const canCreatePayments = user?.role === "Initiator";

    const firstName = user?.name.trim().split(/\s+/)[0] || t("dashboard.user");
    const today = new Date();
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-GB";
    const formatBalance = (amount: number, currency: string) => {
        const symbol = currency.trim().toUpperCase() === "EUR" ? "€ "
            : currency.trim().toUpperCase() === "USD" ? "$ " : "";
        return `${symbol}${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

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

            </header>
            <div className={styles.currencyRow}>
                <CurrencySelector />
            </div>

            <section>
                <h2 className={styles.sectionTitle}>
                    <Landmark size={20} strokeWidth={2} aria-hidden="true" />
                    {t("dashboard.accounts")}
                </h2>

                {loadingAccounts ? (
                    <p role="status">{t("common.loading")}</p>
                ) : accountsError ? (
                    <p role="alert">{t("dashboard.errors.accounts")}</p>
                ) : displayedAccounts.length === 0 ? (
                    <p>{t("dashboard.accountsEmpty")}</p>
                ) : (
                    <>
                    <div className={styles.accountsGrid}>
                        {balances.accounts.map((account) => (
                            <Card key={account.id}
                                variant="ghost"
                                className={styles.accountCard}
                            >
                                <div className={styles.accountHeader}>
                                    <div className={styles.accountIdentity}>
                                        <h3 className={styles.accountName}>{account.name}</h3>
                                    </div>
                                    <span className={styles.currencyBadge}>{account.currency}</span>
                                </div>

                                <div className={styles.balanceSection}>
                                    <p className={styles.accountBalance}>
                                        {formatBalance(account.balance, account.currency)}
                                    </p>
                                </div>

                                {account.currency.trim().toUpperCase() !== balances.primaryCurrency && (
                                    <div className={styles.convertedBalance} aria-live="polite">
                                        <p className={styles.conversionLabel}>{t("dashboard.currency.converted", { currency: balances.primaryCurrency })}</p>
                                        <p className={styles.conversionAmount}>{account.primaryBalance !== null
                                            ? `≈ ${formatBalance(account.primaryBalance, balances.primaryCurrency)}`
                                            : t(loadingRates ? "dashboard.currency.loading" : "dashboard.currency.unavailable")}</p>
                                        {account.rateDate && <p>{t("dashboard.currency.rateDate")} <time dateTime={account.rateDate}>{new Date(`${account.rateDate}T00:00:00`).toLocaleDateString(locale)}</time></p>}
                                    </div>
                                )}
                                <div className={styles.accountFooter}>
                                    <div className={styles.ibanDetails}><span className={styles.balanceLabel}>IBAN</span><p className={styles.accountIban}>{account.iban}</p></div>
                                    <button type="button" className={styles.copyButton}
                                        aria-label={t("dashboard.currency.copyIban", { account: account.name })}
                                        onClick={() => { void copyIban(account.iban); }}>
                                        {t("dashboard.currency.copy")}
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <p role="status" className={styles.summaryMeta}>{copyMessage}</p>
                    </>
                )}
            </section>

            {/* "Recent payments" lists the user's own payments, so it is always empty for roles
                that cannot create payments. */}
            {canCreatePayments && (
            <section className={styles.recentPayments}>
                <h2 className={styles.sectionTitle}>
                    <ReceiptText size={20} strokeWidth={2} aria-hidden="true" />
                    {t("dashboard.recentPayments")}
                </h2>

                <Card>
                    {loadingPayments ? (
                        <p role="status">{t("common.loading")}</p>
                    ) : (
                        <PaymentsTable payments={payments ?? []} accounts={accounts ?? []} locale={locale} />
                    )}
                </Card>
            </section>
            )}
        </div>
    );
}
