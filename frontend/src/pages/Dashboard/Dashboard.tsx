import { useAccounts } from "../../hooks/useAccounts"
import { usePayments } from "../../hooks/usePayments"
import { useAuth } from "../../hooks/useAuth"

import styles from './Dashboard.module.css'

export function Dashboard() {
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts()
    const { data: payments, isLoading: loadingPayments } = usePayments()
    const { user } = useAuth()



    if (accountsError) return <p>Something went wrong.</p>

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <h1>Welcome, {user?.email ?? 'user'}</h1>
                <p>Company name</p>


            </header>

            <section>
                <h2>Accounts</h2>
                {loadingAccounts ? <p>Loading...</p> : (
                    <div className={styles['accounts-grid']}>
                        {accounts?.map(account => (
                            <div key={account.id} className={styles['account-card']}>
                                <p className={styles['account-card__name']}>{account.name}</p>
                                <p className={styles['account-card__balance']}>
                                    {account.balance.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} {account.currency}
                                </p>
                                <p className={styles['account-card__iban']}>{account.iban}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className={styles['dashboard__bottom']}>
                <section>
                    <h2>Recent payments</h2>
                    {loadingPayments ? <p>Loading...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Recipient IBAN</th>
                                    <th>Reference</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments?.map(payment => (
                                    <tr key={payment.id}>
                                        <td>{payment.date}</td>
                                        <td>{payment.toIban}</td>
                                        <td>{payment.reference}</td>
                                        <td>{payment.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} {payment.currency}</td>
                                        <td><span className={`${styles.status} ${styles[payment.status === 'Completed' ? 'status--done' : 'status--pending']}`}>{payment.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    )
}
