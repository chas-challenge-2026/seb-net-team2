import { z } from 'zod'

export const paymentSchema = z.object({
    fromAccountId: z.string().min(1, 'Select an account.'),
    recipient: z.string().trim().min(1, 'Enter a recipient.'),
    iban: z.string().transform(value => value.replaceAll(' ', '').toUpperCase())
    .pipe(
        z.string().min(15, 'Enter an IBAN between 15 and 34 characters.')
        .max(34, 'Enter an IBAN between 15 and 34 characters.')
        .regex(/^[A-Z]{2}[A-Z0-9]+$/, 'Enter a valid IBAN.')
    ),
    amount: z.string().min(1, 'Enter an amount.')
    .refine(value => Number(value) > 0, 'Amount must be greater than 0.'),
    reference: z.string().trim().max(100, 'Reference can contain at most 100 characters.'),
    message: z.string().trim().max(500, 'Message can contain at most 500 characters'),
})

export type PaymentForm = z.input<typeof paymentSchema>