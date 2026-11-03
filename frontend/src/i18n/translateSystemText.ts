import type { TFunction } from "i18next";
import i18n from "./i18n";

// Legacy API responses contain Swedish sentences instead of language-neutral codes.
// Translate only recognised system messages; never rewrite arbitrary user content.
export function translateSystemText(message: string, t: TFunction = i18n.t.bind(i18n)): string {
    const errors: Record<string, string> = {
        "Användare med denna e-postadress finns redan": "emailExists",
        "En användare med denna e-postadress finns redan": "emailExists",
        "Du kan inte ta bort ditt eget konto.": "deleteSelf",
        "Användaren har historik i granskningsloggen och kan inte tas bort.": "userHasHistory",
        "Minst 1 attestant krävs för att skapa en attestbeloppgräns.": "approvalMinimum",
        "Ogiltig e-postadress eller lösenord.": "credentials",
        "User not found or unauthorized.": "unauthorized",
        "Amount must be greater than zero.": "positiveAmount",
        "Account not found or insufficient balance.": "accountOrBalance",
        "Atteststeget hittades inte.": "stepNotFound",
        "Decision måste vara 'approved' eller 'rejected'.": "decision",
        "Steget hör inte till angiven betalning.": "stepPayment",
        "Betalningen väntar inte längre på attest.": "paymentHandled",
        "Det här atteststeget är redan beslutat.": "stepHandled",
        "Kontot hittades inte eller tillhör inte din tenant.": "accountNotFound",
        "Kontot hittades inte": "accountNotFound",
        "TenantId saknas eller är ogiltigt i token.": "unauthorized",
        "Saknar giltigt UserId i token.": "unauthorized",
    };

    if (typeof errors[message] === "string") return t(`errors.api.${errors[message]}`);

    // Local errors can already have been translated when a request failed.
    for (const key of [
        "connection",
        "request",
        "configuration",
        "exchangeConnection",
        "exchangeFetch",
        "exchangeMismatch",
    ]) {
        if (
            ["sv", "en"].some(
                (language) =>
                    i18n.getResource(language, "translation", `errors.${key}`) === message,
            )
        ) {
            return t(`errors.${key}`);
        }
    }

    let match = message.match(/^Kräver (\d+) attestant(?:er)?( \(dubbelattest\))?$/);
    if (match) {
        return t(match[2] ? "approvalLimits.list.requiresDual" : "approvalLimits.list.requires", {
            count: Number(match[1]),
        });
    }

    match = message.match(/^Det finns redan en attestbeloppgräns för beloppet (.+)\.$/);
    if (match) return t("errors.api.limitExists", { amount: match[1] });

    match = message.match(/^Attestbeloppgräns med id: (.+) hittades inte$/);
    if (match) return t("errors.api.limitNotFound");

    match = message.match(/^Användaren med (?:id|e-post): (.+) hittades inte$/);
    if (match) return t("errors.api.userNotFound");

    match = message.match(
        /^Ogiltig hierarki: Beloppgränsen (.+) kräver (\d+) attestanter, medan den högre gränsen (.+) kräver (\d+) attestanter\. Lägre belopp måste kräva färre attestanter än det högre beloppet\.$/,
    );
    if (match)
        return t("errors.api.limitOrder", {
            lowerAmount: match[1],
            lowerCount: match[2],
            higherAmount: match[3],
            higherCount: match[4],
        });

    match = message.match(
        /^Din betalning med referens '(.+)'(?: på (.+))? har (godkänts|avslagits)\.$/,
    );
    if (match)
        return t(
            `notifications.${match[3] === "godkänts" ? "approved" : "rejected"}${match[2] ? "WithAmount" : ""}`,
            {
                reference: match[1],
                amount: match[2],
            },
        );

    match = message.match(/^Betalning '(.+)' \((.+)\) väntar på din attest\.$/);
    if (match) return t("notifications.reminder", { reference: match[1], amount: match[2] });

    if (message === "Du har en betalning att attestera.") return t("notifications.approvalWaiting");

    match = message.match(/^Skapade betalning (.+) ([A-Z]{3}) till ([A-Z0-9 ]+)$/);
    if (match)
        return t("auditLog.summary.payment", { amount: `${match[1]} ${match[2]}`, iban: match[3] });

    match = message.match(
        /^Betalning \d+ genomfördes(?: direkt \(under attestgräns\))?: (.+) ([A-Z]{3}) till ([A-Z0-9 ]+)$/,
    );
    if (match)
        return t("auditLog.summary.payment", { amount: `${match[1]} ${match[2]}`, iban: match[3] });

    match = message.match(/^Betalning \d+ avslogs och (.+) ([A-Z]{3}) återfördes till konto \d+$/);
    if (match) return t("auditLog.summary.refund", { amount: `${match[1]} ${match[2]}` });

    return message;
}
