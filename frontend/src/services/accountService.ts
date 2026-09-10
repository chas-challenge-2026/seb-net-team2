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