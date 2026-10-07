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
    // Not sent by the backend yet. Optional so the inbox keeps working without them,
    // and shows them automatically once the backend adds them to /api/Approval/pending.
    recipientName: z.string().nullish(),
    dueDate: z.string().nullish(), // yyyy-MM-dd
});

export const pendingApprovalStepsSchema = z.array(pendingApprovalStepSchema);

export type PendingApprovalStep = z.infer<typeof pendingApprovalStepSchema>;