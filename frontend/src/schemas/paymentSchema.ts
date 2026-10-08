import { z } from 'zod'

const ibanLengths: Record<string, number> = {
    AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
    BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
    DJ: 27, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18,
    FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
    HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30,
    KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, LY: 25,
    MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18,
    NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
    SA: 24, SC: 31, SE: 24, SI: 19, SK: 24, SM: 27, ST: 25, SV: 28,
    TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
}

export function isValidIban(value: string): boolean {
    const iban = value.replaceAll(' ', '').toUpperCase()
    const countryLength = ibanLengths[iban.slice(0, 2)]

    if (!countryLength || iban.length !== countryLength || !/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
        return false
    }

    const rearranged = iban.slice(4) + iban.slice(0, 4)
    let remainder = 0

    for (const character of rearranged) {
        const digits = character >= 'A' && character <= 'Z'
            ? String(character.charCodeAt(0) - 55)
            : character

        for (const digit of digits) {
            remainder = (remainder * 10 + Number(digit)) % 97
        }
    }

    return remainder === 1
}

export const paymentSchema = z.object({
    fromAccountId: z.string().min(1, 'payment.errors.selectAccount'),
    recipient: z.string().trim().min(1, 'payment.errors.recipientRequired'),
    iban: z.string().transform(value => value.replaceAll(' ', '').toUpperCase())
    .pipe(
        z.string().refine(isValidIban, 'payment.errors.invalidIban')
    ),
    amount: z.string().min(1, 'payment.errors.amountRequired')
    .refine(value => Number(value) > 0, 'payment.errors.amountPositive'),
    reference: z.string().trim().max(100, 'payment.errors.referenceTooLong'),
    message: z.string().trim().max(500, 'payment.errors.messageTooLong'),
})

export type PaymentForm = z.input<typeof paymentSchema>

export const createdPaymentSchema = z.object({
    id: z.coerce.number(),
    fromAccountId: z.coerce.number(),
    toIban: z.string(),
    amount: z.coerce.number(),
    currency: z.string(),
    reference: z.string(),
    status: z.string(),
    createdAt: z.string(),
})

export type CreatedPayment = z.infer<typeof createdPaymentSchema>