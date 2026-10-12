import { z } from "zod";

export const exchangeRateSchema = z.object({
    date: z.iso.date(),
    base: z.string().regex(/^[A-Z]{3}$/),
    quote: z.string().regex(/^[A-Z]{3}$/),
    rate: z.number().positive(),
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;
