import z from "zod";
import type { TFunction } from "i18next";

import { decisionDetailsSchema } from "../../schemas/auditSchema";
import { formatIban, recipientBank } from "../../utils/paymentChecks";

export type ActionKind = "success" | "danger" | "neutral";

const SUCCESS_ACTIONS = new Set(["APPROVE_STEP", "EXECUTE_PAYMENT"]);
const DANGER_ACTIONS = new Set([
    "REJECT_STEP",
    "REJECT_PAYMENT",
    "DELETE_USER",
    "DELETE_APPROVAL_LIMIT",
]);

export function actionKind(action: string): ActionKind {
    if (SUCCESS_ACTIONS.has(action)) return "success";
    if (DANGER_ACTIONS.has(action)) return "danger";
    return "neutral";
}

export function formatTimestamp(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleString(locale, {
        dateStyle: "short",
        timeStyle: "short",
    });
}

// Only the time, e.g. "18:52": the day is the heading of the group the row is in.
export function formatTime(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleTimeString(locale, { timeStyle: "short" });
}

export type DayGroup<T> = { key: string; label: string; entries: T[] };

// Splits a newest-first list into days, e.g. "13 oktober 2026", in the user's time zone.
export function groupByDay<T extends { timeStamp: string }>(entries: T[], locale: string): DayGroup<T>[] {
    const groups: DayGroup<T>[] = [];

    for (const entry of entries) {
        const date = new Date(entry.timeStamp);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const last = groups[groups.length - 1];

        if (last?.key === key) {
            last.entries.push(entry);
        } else {
            const label = date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
            groups.push({ key, label, entries: [entry] });
        }
    }

    return groups;
}

// Returns the step and comment of an approval decision, or nulls for events without them.
export function readDecisionDetails(details: unknown) {
    const parsed = decisionDetailsSchema.safeParse(details);
    if (!parsed.success) return { step: null, totalSteps: null, comment: null };

    return {
        step: parsed.data.stepNumber ?? null,
        totalSteps: parsed.data.totalSteps ?? null,
        comment: parsed.data.comment?.trim() || null,
    };
}

const paymentDetailsSchema = z.object({
    amount: z.number(),
    currency: z.string(),
    toIban: z.string().optional(),
    refundedAmount: z.number().optional(),
});

const limitDetailsSchema = z.object({
    minAmount: z.number(),
    requiredApprovals: z.number(),
});

const userDetailsSchema = z.object({
    name: z.string(),
    email: z.string(),
    role: z.enum(["User", "Admin", "Attestant", "Initiator"]),
});

const updateDetailsSchema = z.object({ after: z.unknown() });

const userChangesSchema = z.object({
    changedFields: z.array(z.enum(["name", "email", "role", "password"])),
});

function formatAmount(amount: number, currency: string, locale: string): string {
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

// A short, translated summary built from the event's details, e.g. "300 000,00 SEK to SE18 5000 … · SEB",
// instead of the backend's Swedish sentence with raw numbers.
// "" means the Event column and the step line already say everything (approval decisions).
// null means there are no usable details (other events, older entries): show the backend's description.
export function describeEntry(action: string, details: unknown, t: TFunction, locale: string): string | null {
    if (action === "APPROVE_STEP" || action === "REJECT_STEP") return "";

    const update = updateDetailsSchema.safeParse(details);
    const current = update.success ? update.data.after : details;

    if (["CREATE_APPROVAL_LIMIT", "UPDATE_APPROVAL_LIMIT", "DELETE_APPROVAL_LIMIT"].includes(action)) {
        const limit = limitDetailsSchema.safeParse(current);
        if (!limit.success) return null;

        return t("auditLog.summary.limit", {
            amount: limit.data.minAmount.toLocaleString(locale),
            count: limit.data.requiredApprovals,
        });
    }

    if (["CREATE_USER", "UPDATE_USER", "DELETE_USER"].includes(action)) {
        const user = userDetailsSchema.safeParse(current);
        if (!user.success) return null;

        const changes = userChangesSchema.safeParse(details);
        if (action === "UPDATE_USER" && changes.success) {
            const fields = changes.data.changedFields.map((field) => t(`auditLog.fields.${field}`));
            return t("auditLog.summary.userChanges", {
                name: user.data.name,
                fields: fields.join(", ") || t("auditLog.summary.noChanges"),
            });
        }

        return t("auditLog.summary.user", {
            name: user.data.name,
            email: user.data.email,
            role: t(`users.roles.${user.data.role}`),
        });
    }

    const parsed = paymentDetailsSchema.safeParse(details);
    if (!parsed.success) return null;

    const amount = formatAmount(parsed.data.amount, parsed.data.currency, locale);

    if (action === "REJECT_PAYMENT") {
        return t("auditLog.summary.refund", { amount });
    }

    if ((action === "CREATE_PAYMENT" || action === "EXECUTE_PAYMENT") && parsed.data.toIban) {
        const bank = recipientBank(parsed.data.toIban);
        const iban = `${formatIban(parsed.data.toIban)}${bank ? ` · ${bank}` : ""}`;
        return t("auditLog.summary.payment", { amount, iban });
    }

    return null;
}
