import { useAccounts } from "../../hooks/useAccounts"
import { usePayments } from "../../hooks/usePayments"
import styles from './Oversikt.module.css'

export function Oversikt() {
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts()
    const { data: payments, isLoading: loadingPayments } = usePayments()

    if (accountsError) return <p>Något gick fel.</p>

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <h1>Välkommen, ________</h1>
                <p>Företagsnamn</p>
            </header>

            <section>
                <h2>Konton</h2>
                {loadingAccounts ? <p>Laddar...</p> : (
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
                    <h2>Senaste betalningar</h2>
                    {loadingPayments ? <p>Laddar...</p> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Till IBAN</th>
                                    <th>Referens</th>
                                    <th>Belopp</th>
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
                                        <td><span className={`${styles.status} ${styles[p.status === 'Genomförd' ? 'status--done' : 'status--pending']}`}>{p.status}</span></td>
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
