import { Link } from "@tanstack/react-router"
import { useAccounts } from "../../hooks/useAccounts"
import { usePayments } from "../../hooks/usePayments"
import { useAuth } from "../../hooks/useAuth"

import styles from './Dashboard.module.css'

export function Dashboard() {
    const { data: accounts, isLoading: loadingAccounts, isError: accountsError } = useAccounts()
    const { data: payments, isLoading: loadingPayments } = usePayments()
    const { user } = useAuth()

    const firstName = user?.name.trim().split(/\s+/)[0] || 'there'
    const today = new Date()
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(today)

    if (accountsError) return <p>Something went wrong.</p>

    return (
        <div className={styles.dashboard}>
            <header className={styles.dashboard__header}>
                <div className={styles.dashboard__intro}>
                    <h1>Good morning, {firstName}</h1>
                    <p>
                        {user?.tenantName && <>{user.tenantName} <span aria-hidden="true">·</span> </>}
                        <time dateTime={today.toISOString().slice(0, 10)}>{formattedDate}</time>
                    </p>
                </div>
                <Link to="/ny-betalning" className={styles.createPaymentLink}>
                    <span>Create payment</span>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 10h12M10 4l6 6-6 6" />
                    </svg>
                </Link>
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
