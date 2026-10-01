import { useState } from "react";
import { useTranslation } from "react-i18next";

import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";

import styles from "./SaveInvest.module.css";

type Tab = "savings" | "investments" | "goals";

type SavingsAccount = {
    name: string;
    balance: number;
    rate: string;
};

type SavingsGoal = {
    name: string;
    saved: number;
    target: number;
};

const accounts: SavingsAccount[] = [
    { name: "Emergency fund", balance: 125000, rate: "2.85%" },
    { name: "Long-term savings", balance: 299000, rate: "3.50%" },
    { name: "Holiday savings", balance: 42000, rate: "2.40%" },
];

const goals: SavingsGoal[] = [
    { name: "New home", saved: 185000, target: 350000 },
    { name: "Summer holiday", saved: 18000, target: 30000 },
];

export function SaveInvest() {
    const { t, i18n } = useTranslation();

    const [activeTab, setActiveTab] = useState<Tab>("savings");
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const [accountList, setAccountList] = useState(accounts);
    const [goalList, setGoalList] = useState(goals);
    const [showAllAccounts, setShowAllAccounts] = useState(false);
    const [modal, setModal] = useState<"account" | "goal" | "manage" | null>(null);
    const [accountName, setAccountName] = useState("");
    const [goalName, setGoalName] = useState("");
    const [goalTarget, setGoalTarget] = useState("");
    const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);

    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";
    const totalSaved = accountList.reduce((sum, account) => sum + account.balance, 0);

    function showActionMessage(message: string) {
        setActionMessage(message);
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>{t("saveInvest.eyebrow")}</p>
                    <h1>{t("saveInvest.title")}</h1>
                    <p>{t("saveInvest.description")}</p>
                </div>

                <Button size="medium" onClick={() => setModal("account")}>
                    {t("saveInvest.actions.openAccount")}
                </Button>
            </header>

            {actionMessage && (
                <div className={styles.actionMessage} role="status">
                    <span>{actionMessage}</span>

                    <button
                        type="button"
                        onClick={() => setActionMessage(null)}
                        aria-label={t("saveInvest.dismissMessage")}
                    >
                        ×
                    </button>
                </div>
            )}

            <nav className={styles.tabs} aria-label={t("saveInvest.navigation")}>
                {(["savings", "investments", "goals"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? styles.activeTab : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {t(`saveInvest.tabs.${tab}`)}
                    </button>
                ))}
            </nav>

            {activeTab === "savings" && (
                <>
                    <section className={styles.heroCard}>
                        <div>
                            <span>{t("saveInvest.savings.totalSaved")}</span>
                            <strong>{totalSaved.toLocaleString(locale)} SEK</strong>
                            <p>{t("saveInvest.savings.acrossAccounts")}</p>
                        </div>

                        <div className={styles.heroMetric}>
                            <span>{t("saveInvest.savings.interestEarned")}</span>
                            <strong>+8 420 SEK</strong>
                        </div>
                    </section>

                    <section>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2>{t("saveInvest.savings.accountsTitle")}</h2>
                                <p>{t("saveInvest.savings.accountsDescription")}</p>
                            </div>

                            <Button
                                variant="ghost"
                                size="small"
                                onClick={() => setShowAllAccounts((current) => !current)}
                            >
                                {showAllAccounts
                                    ? t("saveInvest.actions.showLess")
                                    : t("saveInvest.actions.viewAll")}
                            </Button>
                        </div>

                        <div className={styles.accountGrid}>
                            {accountList
                                .slice(0, showAllAccounts ? accountList.length : 2)
                                .map((account) => (
                                    <Card key={account.name} className={styles.accountCard}>
                                        <span className={styles.cardLabel}>{account.name}</span>

                                        <strong>
                                            {account.balance.toLocaleString(locale)} SEK
                                        </strong>

                                        <span className={styles.rate}>
                                            {account.rate} {t("saveInvest.savings.interestRate")}
                                        </span>

                                        <Button
                                            variant="ghost"
                                            size="small"
                                            onClick={() => {
                                                setSelectedAccount(account);
                                                setModal("manage");
                                            }}
                                        >
                                            {t("saveInvest.actions.manageAccount")}
                                        </Button>
                                    </Card>
                                ))}
                        </div>
                    </section>
                </>
            )}

            {activeTab === "investments" && (
                <section className={styles.contentGrid}>
                    <Card title={t("saveInvest.investments.overview")} variant="primary">
                        <div className={styles.investmentTotal}>412 800 SEK</div>
                        <p className={styles.muted}>
                            {t("saveInvest.investments.portfolioValue")}
                        </p>
                        <div className={styles.positive}>
                            +6.4% {t("saveInvest.investments.thisYear")}
                        </div>
                    </Card>

                    <Card title={t("saveInvest.investments.allocation")}>
                        <div className={styles.allocation}>
                            <span>
                                <i className={styles.equity} /> {t("saveInvest.investments.equities")}
                            </span>
                            <strong>60%</strong>
                        </div>

                        <div className={styles.allocation}>
                            <span>
                                <i className={styles.funds} /> {t("saveInvest.investments.funds")}
                            </span>
                            <strong>30%</strong>
                        </div>

                        <div className={styles.allocation}>
                            <span>
                                <i className={styles.bonds} /> {t("saveInvest.investments.bonds")}
                            </span>
                            <strong>10%</strong>
                        </div>
                    </Card>
                </section>
            )}

            {activeTab === "goals" && (
                <section>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>{t("saveInvest.goals.title")}</h2>
                            <p>{t("saveInvest.goals.description")}</p>
                        </div>

                        <Button size="small" onClick={() => setModal("goal")}>
                            {t("saveInvest.actions.addGoal")}
                        </Button>
                    </div>

                    <div className={styles.goalGrid}>
                        {goalList.map((goal) => {
                            const progress = Math.round((goal.saved / goal.target) * 100);

                            return (
                                <Card key={goal.name} title={goal.name}>
                                    <div className={styles.goalAmounts}>
                                        <strong>{goal.saved.toLocaleString(locale)} SEK</strong>
                                        <span>
                                            {t("saveInvest.goals.of")}{" "}
                                            {goal.target.toLocaleString(locale)} SEK
                                        </span>
                                    </div>

                                    <div className={styles.progressTrack}>
                                        <div style={{ width: `${progress}%` }} />
                                    </div>

                                    <span className={styles.muted}>
                                        {t("saveInvest.goals.complete", { progress })}
                                    </span>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            {modal && (
                <div className={styles.modalBackdrop} role="presentation">
                    <section
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="save-invest-modal-title"
                    >
                        <button
                            className={styles.closeButton}
                            type="button"
                            onClick={() => setModal(null)}
                            aria-label={t("common.close")}
                        >
                            ×
                        </button>

                        {modal === "account" && (
                            <>
                                <p className={styles.eyebrow}>{t("saveInvest.modals.account.eyebrow")}</p>
                                <h2 id="save-invest-modal-title">{t("saveInvest.modals.account.title")}</h2>

                                <p className={styles.muted}>
                                    {t("saveInvest.modals.account.description")}
                                </p>

                                <label className={styles.modalLabel}>
                                    {t("saveInvest.modals.account.name")}

                                    <input
                                        value={accountName}
                                        onChange={(event) => setAccountName(event.target.value)}
                                        placeholder={t("saveInvest.modals.account.placeholder")}
                                    />
                                </label>

                                <Button
                                    onClick={() => {
                                        if (!accountName.trim()) return;

                                        setAccountList((current) => [
                                            ...current,
                                            {
                                                name: accountName.trim(),
                                                balance: 0,
                                                rate: "2.40%",
                                            },
                                        ]);

                                        setAccountName("");
                                        setModal(null);
                                        showActionMessage(t("saveInvest.messages.accountCreated"));
                                    }}
                                >
                                    {t("saveInvest.actions.createAccount")}
                                </Button>
                            </>
                        )}

                        {modal === "goal" && (
                            <>
                                <p className={styles.eyebrow}>{t("saveInvest.modals.goal.eyebrow")}</p>
                                <h2 id="save-invest-modal-title">{t("saveInvest.modals.goal.title")}</h2>

                                <label className={styles.modalLabel}>
                                    {t("saveInvest.modals.goal.name")}

                                    <input
                                        value={goalName}
                                        onChange={(event) => setGoalName(event.target.value)}
                                        placeholder={t("saveInvest.modals.goal.placeholder")}
                                    />
                                </label>

                                <label className={styles.modalLabel}>
                                    {t("saveInvest.modals.goal.target")}

                                    <input
                                        type="number"
                                        min="1"
                                        value={goalTarget}
                                        onChange={(event) => setGoalTarget(event.target.value)}
                                        placeholder="50000"
                                    />
                                </label>

                                <Button
                                    onClick={() => {
                                        const target = Number(goalTarget);

                                        if (!goalName.trim() || !target) return;

                                        setGoalList((current) => [
                                            ...current,
                                            {
                                                name: goalName.trim(),
                                                saved: 0,
                                                target,
                                            },
                                        ]);

                                        setGoalName("");
                                        setGoalTarget("");
                                        setModal(null);
                                        showActionMessage(t("saveInvest.messages.goalCreated"));
                                    }}
                                >
                                    {t("saveInvest.actions.createGoal")}
                                </Button>
                            </>
                        )}

                        {modal === "manage" && selectedAccount && (
                            <>
                                <p className={styles.eyebrow}>{t("saveInvest.modals.manage.eyebrow")}</p>
                                <h2 id="save-invest-modal-title">{selectedAccount.name}</h2>

                                <p className={styles.investmentTotal}>
                                    {selectedAccount.balance.toLocaleString(locale)} SEK
                                </p>

                                <p className={styles.muted}>
                                    {t("saveInvest.modals.manage.interestRate", {
                                        rate: selectedAccount.rate,
                                    })}
                                </p>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setModal(null);
                                        showActionMessage(t("saveInvest.messages.accountOpened"));
                                    }}
                                >
                                    {t("common.done")}
                                </Button>
                            </>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}