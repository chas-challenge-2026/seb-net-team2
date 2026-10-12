import z from "zod";

export const approvalDecisionSchema = z.object({
    stepId: z.string().uuid(),
    decision: z.enum([
        "approved",
        "rejected",
    ]),
    comment: z.string().optional(),
});

export type ApprovalDecision =
    z.infer<typeof approvalDecisionSchema>;