import { isValidIban } from "../schemas/paymentSchema";
import type { PendingApprovalStep } from "../schemas/pendingApprovalSchema";

// Amounts at or above this (in SEK) get a "check extra carefully" warning.
// An assumption, not a business rule from the bank: adjust when the team agrees on a limit.
export const HIGH_AMOUNT_THRESHOLD_SEK = 100_000;

// The customers are Swedish companies, so a recipient abroad is unusual and worth a second look:
// a forged invoice with a changed (often foreign) IBAN is a common fraud against companies.
export const HOME_COUNTRY = "SE";

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

// Groups the IBAN in blocks of four (e.g. "SE60 3000 0000 ...") so it can be checked by eye.
export function formatIban(iban: string): string {
    return iban.replace(/\s/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

// Returns the recipient's bank for Swedish IBANs we recognise, otherwise null.
export function recipientBank(iban: string): string | null {
    const normalized = normalizeIban(iban);
    if (!normalized.startsWith("SE")) return null;
    return SWEDISH_BANK_CODES[normalized.slice(4, 7)] ?? null;
}

// The first two letters of an IBAN are the recipient's country code, e.g. "DE".
export function ibanCountry(iban: string): string | null {
    const code = normalizeIban(iban).slice(0, 2);
    return /^[A-Z]{2}$/.test(code) ? code : null;
}

export type PaymentChecks = {
    ibanValid: boolean;
    // Country code when the recipient is outside HOME_COUNTRY, otherwise null.
    foreignCountry: string | null;
    // Other pending payments with the same recipient and amount: a possible double payment.
    duplicateOf: number[];
    highAmount: boolean;
};

export function checkPayment(
    approval: PendingApprovalStep,
    allPending: PendingApprovalStep[]
): PaymentChecks {
    const iban = normalizeIban(approval.toIban);
    const country = ibanCountry(iban);

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
        foreignCountry: country && country !== HOME_COUNTRY ? country : null,
        duplicateOf: [...new Set(duplicateOf)],
        highAmount: approval.currency === "SEK" && approval.amount >= HIGH_AMOUNT_THRESHOLD_SEK,
    };
}
