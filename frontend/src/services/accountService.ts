
import { apiRequest } from './apiRequest'
import { createdPaymentSchema, type CreatedPayment } from '../schemas/paymentSchema'


export interface Account {
    id: string
    name: string
    balance: number
    currency: string
    iban: string
}

export interface Payment {
    id: string
    date: string
    toIban: string
    reference: string
    amount: number
    currency: string
    status: 'Completed' | 'Pending approval' | 'Rejected'
}

// Replace mock data with API requests when the backend is ready.

export async function fetchAccounts(): Promise<Account[]> {
    return [

        { id: '1', name: 'Operating account', balance: 2500000, currency: 'SEK', iban: 'SE4550000000058398257466' },
        { id: '2', name: 'Payroll account', balance: 890000, currency: 'SEK', iban: 'SE4550000000058398257467' },
        { id: '3', name: 'Project account', balance: 450000, currency: 'SEK', iban: 'SE4550000000058398257468' },
    ]
}

export async function fetchRecentPayments(): Promise<Payment[]> {
    return [
        { id: '1', date: '2026-08-13', toIban: 'SE8550000000054910000003', reference: 'Invoice #1042', amount: 15000, currency: 'SEK', status: 'Completed' },
        { id: '2', date: '2026-08-13', toIban: 'SE8550000000054910000004', reference: 'Invoice #1043', amount: 75000, currency: 'SEK', status: 'Pending approval' },

    ]
}

export type CreatePaymentRequest = {
    fromAccountId: number
    toIban: string
    amount: number
    currency: 'SEK'
    reference: string
}

export async function createPayment(
    payment: CreatePaymentRequest,
    idempotencyKey: string,
): Promise<CreatedPayment> {
    const apiUrl = import.meta.env.VITE_API_URL

    if (!apiUrl) {
        throw new Error('VITE_API_URL is not configured.')
    }

    return apiRequest(
        `${apiUrl}/api/Payment`,
        createdPaymentSchema,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(payment),
        },
    )
}