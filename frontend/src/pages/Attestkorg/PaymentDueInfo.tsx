import { useTranslation } from "react-i18next";

import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { dueStatus } from "../../utils/approvalReminders";

import styles from "./Attestkorg.module.css";

function formatDueDate(dueDate: string, locale: string): string {
    const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(locale, { dateStyle: "medium" });
}

// "Förfaller i dag" / "Förfaller i morgon" / "Förfallen" next to the waiting time.
// Renders nothing until the backend sends a due date, or when it is further away.
export function DueBadge({ approval }: { approval: PendingApprovalStep }) {
    const { t } = useTranslation();
    const status = dueStatus(approval);

    if (status === null || status === "later") return null;

    return (
        <p className={status === "tomorrow" ? styles.dueSoon : styles.overdue}>
            {t(`approvalInbox.card.due.${status}`)}
        </p>
    );
}

// <dt>/<dd> rows for recipient name and due date. Each row only appears when the backend sends it.
export function RecipientAndDueRows({ approval }: { approval: PendingApprovalStep }) {
    const { t, i18n } = useTranslation();
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    return (
        <>
            {approval.recipientName && (
                <div>
                    <dt>{t("approvalInbox.card.recipient")}</dt>
                    <dd>{approval.recipientName}</dd>
                </div>
            )}

            {approval.dueDate && (
                <div>
                    <dt>{t("approvalInbox.card.dueDate")}</dt>
                    <dd>{formatDueDate(approval.dueDate, locale)}</dd>
                </div>
            )}
        </>
    );
}
