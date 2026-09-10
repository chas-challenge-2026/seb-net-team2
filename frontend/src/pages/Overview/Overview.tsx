import { useAccounts } from "../../hooks/useAccounts"
import { usePayments } from "../../hooks/usePayments"
import styles from './Overview.module.css'

export function Overview() {
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts()
    const { data: payments, isLoading: loadingPayments } = usePayments()

    if (accountsError) return <p>Something went wrong.</p>

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <h1>Welcome, ________</h1>
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
                                {payments?.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.date}</td>
                                        <td>{p.toIban}</td>
                                        <td>{p.reference}</td>
                                        <td>{p.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} {p.currency}</td>
                                        <td><span className={`${styles.status} ${styles[p.status === 'Completed' ? 'status--done' : 'status--pending']}`}>{p.status}</span></td>
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
