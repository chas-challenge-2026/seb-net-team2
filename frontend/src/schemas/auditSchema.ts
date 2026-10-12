import z from "zod";

export const auditEntrySchema = z.object({
    id: z.number(),
    timeStamp: z.string(),
    userId: z.number(),
    userName: z.string(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.number(),
    description: z.string(),
    details: z.unknown().optional(),
});

// The fields an approval decision stores in `details`. Other events store other fields,
// so this is read with safeParse per entry instead of being part of auditEntrySchema.
export const decisionDetailsSchema = z.object({
    comment: z.string().nullish(),
    stepNumber: z.number().nullish(),
    totalSteps: z.number().nullish(),
});

export const auditPageSchema = z.object({
    items: z.array(auditEntrySchema),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;
export type AuditPage = z.infer<typeof auditPageSchema>;
