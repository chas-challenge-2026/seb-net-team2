import type { PendingApprovalStep } from "../../schemas/pendingApprovalSchema";

function formatMoney(amount: number, currency: string, locale: string): string {
    return `${amount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
}

export function formatAmount(approval: Pick<PendingApprovalStep, "amount" | "currency">, locale: string): string {
    return formatMoney(approval.amount, approval.currency, locale);
}

// Summed per currency, since payments in different currencies can't be added together.
export function formatTotals(approvals: Pick<PendingApprovalStep, "amount" | "currency">[], locale: string): string {
    const totalsByCurrency = approvals.reduce<Record<string, number>>((totals, approval) => {
        totals[approval.currency] = (totals[approval.currency] ?? 0) + approval.amount;
        return totals;
    }, {});

    return Object.entries(totalsByCurrency)
        .map(([currency, amount]) => formatMoney(amount, currency, locale))
        .join(" + ");
}
