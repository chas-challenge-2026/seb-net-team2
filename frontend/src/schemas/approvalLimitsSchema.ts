import { z } from "zod";

export const approvalLimitSchema = z.object({
    id: z.number(),
    tenantId: z.number(),
    minAmount: z.number(),
    requiredApprovals: z.number(),
    description: z.string(),
    lastModifiedAt: z.string(),
    lastModifiedBy: z.string(),
});

export const approvalLimitsSchema =
    z.array(approvalLimitSchema);

export const createApprovalLimitSchema =
    z.object({
        minAmount: z
            .number()
            .min(0),

        requiredApprovals: z
            .number()
            .int()
            .min(1),

        description: z.string(),
    });

export const updateApprovalLimitSchema =
    z.object({
        minAmount: z
            .number()
            .min(0)
            .optional(),

        requiredApprovals: z
            .number()
            .int()
            .min(1)
            .optional(),

        description: z
            .string()
            .optional(),
    });

export type ApprovalLimit = z.infer<
    typeof approvalLimitSchema
>;

export type CreateApprovalLimit =
    z.infer<
        typeof createApprovalLimitSchema
    >;

export type UpdateApprovalLimit =
    z.infer<
        typeof updateApprovalLimitSchema
    >;