import { useState } from 'react'
import styles from './Attestkorg.module.css'

type Payment = {
    id: string
    recipient: string
    reference: string
    amount: string
    submittedBy: string
    submittedAt: string
}

const initialPayments: Payment[] = [
    {
        id: 'PAY-1043',
        recipient: 'Malmö Bygg AB',
        reference: 'Invoice #1043',
        amount: '75 000,00 SEK',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-13',
    },
    {
        id: 'PAY-1044',
        recipient: 'Nordic Office Supply AB',
        reference: 'Invoice #1044',
        amount: '125 000,00 SEK',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-14',
    },
]

export function Attestkorg() {
    const [payments, setPayments] = useState(initialPayments)

    const removePayment = (id: string) => {
        setPayments((currentPayments) => currentPayments.filter((payment) => payment.id !== id))
    }

    return (
        <section className={styles.inbox} aria-labelledby="approval-inbox-title">
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Approvals</p>
                    <h1 id="approval-inbox-title">Approval inbox</h1>
                    <p className={styles.intro}>Payments waiting for your review and approval.</p>
                </div>
                <span className={styles.count} role="status" aria-live="polite">
                    {payments.length} pending
                </span>
            </header>

            <div className={styles.list}>
                {payments.length > 0 ? payments.map((payment) => (
                    <article className={styles.card} key={payment.id} aria-labelledby={`${payment.id}-recipient`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.paymentId}>Waiting for approval</p>
                                <h2 id={`${payment.id}-recipient`}>{payment.recipient}</h2>
                            </div>
                            <strong>{payment.amount}</strong>
                        </div>
                        <dl className={styles.details}>
                            <div><dt>Reference</dt><dd>{payment.reference}</dd></div>
                            <div><dt>Submitted by</dt><dd>{payment.submittedBy}</dd></div>
                            <div><dt>Submitted</dt><dd>{payment.submittedAt}</dd></div>
                        </dl>
                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.reject}
                                onClick={() => removePayment(payment.id)}
                                aria-label={`Reject payment to ${payment.recipient}`}
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                className={styles.approve}
                                onClick={() => removePayment(payment.id)}
                                aria-label={`Approve payment to ${payment.recipient}`}
                            >
                                Approve
                            </button>
                        </div>
                    </article>
                )) : (
                    <div className={styles.emptyState}>
                        <h2>All caught up</h2>
                        <p>There are no payments waiting for your approval.</p>
                    </div>
                )}
            </div>
        </section>
    )
}
