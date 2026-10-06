import { z } from "zod";

export const accountResponseSchema = z.object({
    id: z.coerce.number(),
    tenantId: z.coerce.number(),
    accountName: z.string(),
    iban: z.string(),
    balance: z.coerce.number(),
    currency: z.string(),
});

export const accountListSchema = z.array(accountResponseSchema);

export type AccountResponse = z.infer<typeof accountResponseSchema>;
