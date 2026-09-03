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
    status: 'Genomförd' | 'Väntar på attest' | 'Avvisad'
}

//mockdata tills backend api redo

export async function fetchAccounts(): Promise<Account[]> {
    return [

        {id: '1', name: 'Driftkonto', balance: 2500000, currency: 'SEK', iban: 'SE4550000000058398257466' },
        { id: '2', name: 'Lönekonto', balance: 890000, currency: 'SEK', iban: 'SE4550000000058398257467' },
        { id: '3', name: 'Projektkonto', balance: 450000, currency: 'SEK', iban: 'SE4550000000058398257468' },
    ]
}

export async function fetchRecentPayments(): Promise<Payment[]> {
    return [
         { id: '1', date: '2026-08-13', toIban: 'SE8550000000054910000003', reference: 'Faktura #1042', amount: 15000, currency: 'SEK', status: 'Genomförd' },
         { id: '2', date: '2026-08-13', toIban: 'SE8550000000054910000004', reference: 'Faktura #1043', amount: 75000, currency: 'SEK', status: 'Väntar på attest' },

    ]
}
  //  const res = await fetch('/api/accounts')
//if(!res.ok) throw new Error("Kunde inte hämta konton")
       // return res.json()
//}