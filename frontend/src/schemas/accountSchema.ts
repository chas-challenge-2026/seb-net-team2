import { z } from "zod";

export const accountResponseSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.coerce.number(),
    accountName: z.string(),
    iban: z.string(),
    balance: z.coerce.number(),
    currency: z.string(),
});

export const accountListSchema = z.array(accountResponseSchema);

export type AccountResponse = z.infer<typeof accountResponseSchema>;
