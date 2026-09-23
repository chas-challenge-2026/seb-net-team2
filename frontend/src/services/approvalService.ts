export type Payment = {
    id: string
    recipient: string
    reference: string
    amount: number
    currency: string
    toIban: string
    fromAccount: string
    submittedBy: string
    submittedAt: string
    status: 'pending' | 'completed' | 'rejected'
    comment?: string
    decidedAt?: string
}

// Replace mock data with API requests when the backend has an endpoint for pending approvals.

const initialPayments: Payment[] = [
    {
        id: 'PAY-1043',
        recipient: 'Malmö Bygg AB',
        reference: 'Invoice #1043',
        amount: 75000,
        currency: 'SEK',
        toIban: 'SE85 5000 0000 0549 1000 0003',
        fromAccount: 'Operating account',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-13',
        status: 'pending',
    },
    {
        id: 'PAY-1044',
        recipient: 'Nordic Office Supply AB',
        reference: 'Invoice #1044',
        amount: 125000,
        currency: 'SEK',
        toIban: 'SE85 5000 0000 0549 1000 0004',
        fromAccount: 'Operating account',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-14',
        status: 'pending',
    },
]

export async function fetchPendingApprovals(): Promise<Payment[]> {
    return initialPayments
}
