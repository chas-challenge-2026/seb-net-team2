
import { z } from 'zod'

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

function mapPaymentStatus(status: string): Payment['status'] {
    switch (status) {
        case 'completed':
            return 'Completed'
        case 'rejected':
            return 'Rejected'
        default:
            return 'Pending approval'
    }
}

export async function fetchRecentPayments(): Promise<Payment[]> {
    const apiUrl = import.meta.env.VITE_API_URL

    if (!apiUrl) {
        throw new Error('VITE_API_URL is not configured.')
    }

    const payments = await apiRequest(
        `${apiUrl}/api/Payment/mine`,
        z.array(createdPaymentSchema),
    )

    return payments
        .map((payment) => ({
            id: String(payment.id),
            date: payment.createdAt.slice(0, 10),
            toIban: payment.toIban,
            reference: payment.reference,
            amount: payment.amount,
            currency: payment.currency,
            status: mapPaymentStatus(payment.status),
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
}

export type CreatePaymentRequest = {
    tenantId: number
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