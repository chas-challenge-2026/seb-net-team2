import { decisionDetailsSchema } from "../../schemas/auditSchema";

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
