import { useTranslation } from "react-i18next";
import { CircleAlert, TriangleAlert } from "lucide-react";

import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";
import { checkPayment } from "../../utils/paymentChecks";

import styles from "./Attestkorg.module.css";

type PaymentChecksProps = {
    approval: PendingApprovalStep;
    allPending: PendingApprovalStep[];
};

// Decision support on each card: shown only when something needs a closer look,
// so that the box always means "check this" and never becomes noise.
// Each warning has an icon and text, never colour alone.
// Country name in the user's language, e.g. "DE" → "Tyskland" / "Germany".
function countryName(code: string, language: string): string {
    try {
        return new Intl.DisplayNames([language], { type: "region" }).of(code) ?? code;
    } catch {
        return code;
    }
}

export function PaymentChecks({ approval, allPending }: PaymentChecksProps) {
    const { t, i18n } = useTranslation();
    const checks = checkPayment(approval, allPending);

    const hasWarnings =
        !checks.ibanValid ||
        checks.foreignCountry !== null ||
        checks.duplicateOf.length > 0 ||
        checks.highAmount;

    if (!hasWarnings) return null;

    return (
        <section
            className={styles.checks}
            aria-label={t("approvalInbox.checks.title")}
        >
            <p className={styles.checksTitle}>{t("approvalInbox.checks.title")}</p>

            <ul className={styles.checksList}>
                {!checks.ibanValid && (
                    <li className={styles.checkError}>
                        <CircleAlert size={16} aria-hidden="true" />
                        {t("approvalInbox.checks.ibanInvalid")}
                    </li>
                )}

                {checks.foreignCountry && (
                    <li className={styles.checkWarning}>
                        <TriangleAlert size={16} aria-hidden="true" />
                        {t("approvalInbox.checks.foreignRecipient", {
                            country: countryName(
                                checks.foreignCountry,
                                i18n.resolvedLanguage ?? "sv"
                            ),
                        })}
                    </li>
                )}

                {checks.duplicateOf.length > 0 && (
                    <li className={styles.checkWarning}>
                        <TriangleAlert size={16} aria-hidden="true" />
                        {t("approvalInbox.checks.duplicate", {
                            payments: checks.duplicateOf.map((id) => `#${id}`).join(", "),
                        })}
                    </li>
                )}

                {checks.highAmount && (
                    <li className={styles.checkWarning}>
                        <TriangleAlert size={16} aria-hidden="true" />
                        {t("approvalInbox.checks.highAmount")}
                    </li>
                )}
            </ul>
        </section>
    );
}
