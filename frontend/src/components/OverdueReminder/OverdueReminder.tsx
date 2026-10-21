import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useApprovals } from "../../hooks/useApprovals";
import { useAuth } from "../../hooks/useAuth";
import { OVERDUE_AFTER_DAYS, countOverdue } from "../../utils/approvalReminders";

import styles from "./OverdueReminder.module.css";

const DISMISSED_KEY = "overdueReminderDismissed";

function readDismissed(): boolean {
    try {
        return sessionStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
        return false;
    }
}

function saveDismissed() {
    try {
        sessionStorage.setItem(DISMISSED_KEY, "true");
    } catch {
        // Storage can be unavailable; the reminder then reappears next load.
    }
}

export function OverdueReminder() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const canApprove =
        user?.role === "Attestant" ||
        user?.role === "Admin";

    const { data: approvals } = useApprovals(canApprove);
    const [dismissed, setDismissed] = useState(readDismissed);

    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });

    const overdueCount = countOverdue(approvals);

    if (
        !canApprove ||
        dismissed ||
        overdueCount === 0 ||
        pathname === "/attestkorg"
    ) {
        return null;
    }

    function dismiss() {
        saveDismissed();
        setDismissed(true);
    }

    return (
        <div
            className={styles.toast}
            role="status"
            aria-live="polite"
        >
            <div className={styles.body}>
                <strong className={styles.title}>
                    {t("overdueReminder.title")}
                </strong>

                <p className={styles.message}>
                    {t("overdueReminder.message", {
                        count: overdueCount,
                        days: OVERDUE_AFTER_DAYS,
                    })}
                </p>

                <Link
                    to="/attestkorg"
                    className={styles.link}
                    onClick={dismiss}
                >
                    {t("overdueReminder.goToInbox")}
                </Link>
            </div>

            <button
                type="button"
                className={styles.close}
                onClick={dismiss}
                aria-label={t("overdueReminder.dismiss")}
            >
                ×
            </button>
        </div>
    );
}