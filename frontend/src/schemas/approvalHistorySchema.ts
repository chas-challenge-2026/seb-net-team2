import z from "zod";

// GET /api/Approval/history: the approval steps the current attestant has handled.
// The schema is deliberately tolerant so the "Handled" tab works with what the backend sends today:
// - ids may be numbers (history) or UUIDs (pending), so both are accepted and stored as strings
// - the decision, comment and decision date are not sent yet; they are optional and are shown
//   automatically once the backend adds them, under the most likely names.

const idSchema = z.union([z.string(), z.number()]).transform(String);

// Accepts "decision" or "status" (the database column) and keeps only real decisions.
function readDecision(value: unknown): "approved" | "rejected" | undefined {
    if (typeof value !== "string") return undefined;
    const normalized = value.toLowerCase();
    return normalized === "approved" || normalized === "rejected" ? normalized : undefined;
}

export const decidedApprovalSchema = z.preprocess(
    (raw) => {
        if (typeof raw !== "object" || raw === null) return raw;
        const entry = raw as Record<string, unknown>;

        return {
            ...entry,
            decision: readDecision(entry.decision ?? entry.status),
            decidedAt: entry.decidedAt ?? entry.decided_at ?? null,
        };
    },
    z.object({
        stepId: idSchema,
        stepNumber: z.number(),
        paymentId: idSchema,
        reference: z.string(),
        amount: z.number(),
        currency: z.string(),
        toIban: z.string(),
        recipientName: z.string().nullish(),
        createdByUserName: z.string().default(""),
        paymentCreatedAt: z.string().nullish(),
        decision: z.enum(["approved", "rejected"]).optional(),
        comment: z.string().nullish(),
        decidedAt: z.string().nullish(),
    })
);

export const decidedApprovalsSchema = z.array(decidedApprovalSchema);

export type DecidedApproval = z.infer<typeof decidedApprovalSchema>;

// The date to show and sort by: when the attestant decided, or when the payment was created
// as long as the backend doesn't send the decision date.
export function historyEntryDate(entry: DecidedApproval): string {
    return entry.decidedAt ?? entry.paymentCreatedAt ?? "";
}
