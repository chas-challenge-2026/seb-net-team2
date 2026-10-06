import { isValidIban } from "../schemas/paymentSchema";
import type { PendingApprovalStep } from "../schemas/pendingApprovalSchema";

// Amounts at or above this (in SEK) get a "check extra carefully" warning.
// An assumption, not a business rule from the bank: adjust when the team agrees on a limit.
export const HIGH_AMOUNT_THRESHOLD_SEK = 100_000;

// Swedish IBANs carry the bank's code in positions 5–7 (after "SE" and the two check digits).
const SWEDISH_BANK_CODES: Record<string, string> = {
    "120": "Danske Bank",
    "300": "Nordea",
    "500": "SEB",
    "600": "Handelsbanken",
    "800": "Swedbank",
    "902": "Länsförsäkringar Bank",
};

function normalizeIban(iban: string): string {
    return iban.replace(/\s/g, "").toUpperCase();
}

// Returns the recipient's bank for Swedish IBANs we recognise, otherwise null.
export function recipientBank(iban: string): string | null {
    const normalized = normalizeIban(iban);
    if (!normalized.startsWith("SE")) return null;
    return SWEDISH_BANK_CODES[normalized.slice(4, 7)] ?? null;
}

export type PaymentChecks = {
    ibanValid: boolean;
    // Other pending payments with the same recipient and amount: a possible double payment.
    duplicateOf: number[];
    highAmount: boolean;
};

export function checkPayment(
    approval: PendingApprovalStep,
    allPending: PendingApprovalStep[]
): PaymentChecks {
    const iban = normalizeIban(approval.toIban);

    const duplicateOf = allPending
        .filter((other) =>
            other.paymentId !== approval.paymentId &&
            normalizeIban(other.toIban) === iban &&
            other.amount === approval.amount &&
            other.currency === approval.currency
        )
        .map((other) => other.paymentId);

    return {
        ibanValid: isValidIban(approval.toIban),
        duplicateOf: [...new Set(duplicateOf)],
        highAmount: approval.currency === "SEK" && approval.amount >= HIGH_AMOUNT_THRESHOLD_SEK,
    };
}
