import z from "zod"

export const pendingApprovalStepSchema = z.object({
    stepId: z.number(),
    stepNumber: z.number(),
    paymentId: z.number(),
    amount: z.number(),
    currency: z.string(),
    toIban: z.string(),
    reference: z.string(),
    createdByUserId: z.number(),
    createdByUserName: z.string(),
    paymentCreatedAt: z.string(),
});

export const pendingApprovalStepsSchema = z.array(pendingApprovalStepSchema);

export type PendingApprovalStep = z.infer<typeof pendingApprovalStepSchema>;