import { useState } from 'react'
import styles from './Attestkorg.module.css'

type Payment = {
    id: string
    recipient: string
    reference: string
    amount: string
    submittedBy: string
    submittedAt: string
    status: 'pending' | 'completed' | 'rejected'
    comment?: string
}

const initialPayments: Payment[] = [
    {
        id: 'PAY-1043',
        recipient: 'Malmö Bygg AB',
        reference: 'Invoice #1043',
        amount: '75 000,00 SEK',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-13',
        status: 'pending',
    },
    {
        id: 'PAY-1044',
        recipient: 'Nordic Office Supply AB',
        reference: 'Invoice #1044',
        amount: '125 000,00 SEK',
        submittedBy: 'Lisa Svensson',
        submittedAt: '2026-08-14',
        status: 'pending',
    },
]

export function Attestkorg() {
    const [payments, setPayments] = useState(initialPayments)

    const updatePayment = (id: string, status: Payment['status'], comment?: string) => {
        setPayments((currentPayments) => currentPayments.map((payment) => (
            payment.id === id ? { ...payment, status, comment } : payment
        )))
    }

    const updateComment = (id: string, comment: string) => {
        setPayments((currentPayments) => currentPayments.map((payment) => (
            payment.id === id ? { ...payment, comment } : payment
        )))
    }

    const pendingPayments = payments.filter((payment) => payment.status === 'pending')

    const statusLabels: Record<Payment['status'], string> = {
        pending: 'Waiting for approval',
        completed: 'Approved',
        rejected: 'Rejected',
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
                    {pendingPayments.length} pending
                </span>
            </header>

            <div className={styles.list}>
                {payments.length > 0 ? payments.map((payment) => (
                    <article className={styles.card} key={payment.id} aria-labelledby={`${payment.id}-recipient`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={`${styles.paymentId} ${styles[`status-${payment.status}`]}`}>
                                    {statusLabels[payment.status]}
                                </p>
                                <h2 id={`${payment.id}-recipient`}>{payment.recipient}</h2>
                            </div>
                            <strong>{payment.amount}</strong>
                        </div>
                        <dl className={styles.details}>
                            <div><dt>Reference</dt><dd>{payment.reference}</dd></div>
                            <div><dt>Submitted by</dt><dd>{payment.submittedBy}</dd></div>
                            <div><dt>Submitted</dt><dd>{payment.submittedAt}</dd></div>
                        </dl>
                        {payment.status === 'pending' ? (
                            <>
                                <div className={styles.commentField}>
                                    <label htmlFor={`${payment.id}-comment`}>Comment (optional)</label>
                                    <textarea
                                        id={`${payment.id}-comment`}
                                        value={payment.comment ?? ''}
                                        onChange={(event) => updateComment(payment.id, event.target.value)}
                                        rows={2}
                                        placeholder="Add a comment"
                                    />
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.reject}
                                        onClick={() => updatePayment(payment.id, 'rejected', payment.comment)}
                                        aria-label={`Reject payment to ${payment.recipient}`}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.approve}
                                        onClick={() => updatePayment(payment.id, 'completed', payment.comment)}
                                        aria-label={`Approve payment to ${payment.recipient}`}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={`${styles.decision} ${styles[`decision-${payment.status}`]}`}>
                                <p>Decision recorded</p>
                                {payment.comment && <blockquote>{payment.comment}</blockquote>}
                            </div>
                        )}
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
