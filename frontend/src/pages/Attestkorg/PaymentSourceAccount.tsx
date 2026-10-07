import { useTranslation } from "react-i18next";

import { usePaymentSourceAccount } from "../../hooks/usePaymentSourceAccount";
import { formatIban } from "../../utils/paymentChecks";

// One <dt>/<dd> row for a payment's details list: "Från konto · Driftkonto · SE45 5000 …".
export function PaymentSourceAccount({ paymentId }: { paymentId: number }) {
    const { t } = useTranslation();
    const { account, fromAccountId, isPending, isError } = usePaymentSourceAccount(paymentId);

    // Without the information there's nothing useful to show, so leave the row out
    // rather than filling the card with an error.
    if (isError) return null;

    return (
        <div>
            <dt>{t("approvalInbox.card.fromAccount")}</dt>
            <dd>
                {isPending
                    ? t("common.loading")
                    : account
                        ? `${account.name} · ${formatIban(account.iban)}`
                        : t("approvalInbox.card.accountNumber", { id: fromAccountId })}
            </dd>
        </div>
    );
}
