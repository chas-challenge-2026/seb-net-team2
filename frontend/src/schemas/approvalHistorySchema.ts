import z from "zod";

// Proposed contract for GET /api/Approval/history (not built in the backend yet):
// the approval steps the current attestant has decided, newest first.
export const decidedApprovalSchema = z.object({
    stepId: z.number(),
    stepNumber: z.number(),
    paymentId: z.number(),
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    toIban: z.string(),
    recipientName: z.string().nullish(),
    createdByUserName: z.string(),
    decision: z.enum(["approved", "rejected"]),
    comment: z.string().nullish(),
    decidedAt: z.string(),
});

export const decidedApprovalsSchema = z.array(decidedApprovalSchema);

export type DecidedApproval = z.infer<typeof decidedApprovalSchema>;
