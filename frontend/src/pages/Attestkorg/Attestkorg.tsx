import { useEffect, useRef, useState } from 'react'
import styles from './Attestkorg.module.css'

const COMMENT_MAX_LENGTH = 300

type Payment = {
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

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
type HistoryStatusFilter = 'all' | 'completed' | 'rejected'
type ConfirmAction = { payment: Payment; kind: 'approve' | 'reject' }

function formatAmount(payment: Payment): string {
    return `${payment.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} ${payment.currency}`
}

function sortPayments(payments: Payment[], sortOption: SortOption, dateField: 'submittedAt' | 'decidedAt'): Payment[] {
    return [...payments].sort((a, b) => {
        switch (sortOption) {
            case 'date-asc':
                return (a[dateField] ?? '').localeCompare(b[dateField] ?? '')
            case 'date-desc':
                return (b[dateField] ?? '').localeCompare(a[dateField] ?? '')
            case 'amount-asc':
                return a.amount - b.amount
            case 'amount-desc':
                return b.amount - a.amount
        }
    })
}

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

export function Attestkorg() {
    const [payments, setPayments] = useState(initialPayments)
    const [pendingSort, setPendingSort] = useState<SortOption>('date-desc')
    const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('all')
    const [historySort, setHistorySort] = useState<SortOption>('date-desc')
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    const cancelButtonRef = useRef<HTMLButtonElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLElement | null>(null)

    const closeConfirm = () => {
        setConfirmAction(null)
        triggerRef.current?.focus()
    }

    useEffect(() => {
        if (!confirmAction) return
        cancelButtonRef.current?.focus()

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeConfirm()
                return
            }
            if (event.key !== 'Tab' || !modalRef.current) return

            const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (focusable.length === 0) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [confirmAction])

    const updatePayment = (id: string, status: Payment['status'], comment?: string) => {
        setPayments((currentPayments) => currentPayments.map((payment) => (
            payment.id === id
                ? { ...payment, status, comment, decidedAt: new Date().toISOString().slice(0, 10) }
                : payment
        )))
    }

    const updateComment = (id: string, comment: string) => {
        setPayments((currentPayments) => currentPayments.map((payment) => (
            payment.id === id ? { ...payment, comment } : payment
        )))
    }

    const pendingPayments = payments.filter((payment) => payment.status === 'pending')
    const sortedPendingPayments = sortPayments(pendingPayments, pendingSort, 'submittedAt')

    const handledPayments = payments.filter((payment) => payment.status !== 'pending')
    const filteredHandledPayments = handledPayments.filter((payment) => (
        historyStatusFilter === 'all' ? true : payment.status === historyStatusFilter
    ))
    const sortedHandledPayments = sortPayments(filteredHandledPayments, historySort, 'decidedAt')

    const statusLabels: Record<Payment['status'], string> = {
        pending: 'Waiting for approval',
        completed: 'Approved',
        rejected: 'Rejected',
    }

    const confirmLabel = confirmAction?.kind === 'approve' ? 'Approve' : 'Reject'

    const handleApprove = (payment: Payment, event: React.MouseEvent<HTMLButtonElement>) => {
        triggerRef.current = event.currentTarget
        setConfirmAction({ payment, kind: 'approve' })
    }

    const handleReject = (payment: Payment, event: React.MouseEvent<HTMLButtonElement>) => {
        triggerRef.current = event.currentTarget
        setConfirmAction({ payment, kind: 'reject' })
    }

    const handleConfirm = () => {
        if (!confirmAction) return
        const { payment, kind } = confirmAction
        updatePayment(payment.id, kind === 'approve' ? 'completed' : 'rejected', payment.comment)
        closeConfirm()
    }

    return (
        <section className={styles.inbox} aria-labelledby="approval-inbox-title">
            <header className={styles.header}>
                <div>
                    <h1 id="approval-inbox-title">Approval inbox</h1>
                    <p className={styles.intro}>Payments awaiting your decision.</p>
                </div>
                <span
                    className={`${styles.count} ${pendingPayments.length === 0 ? styles.countZero : ''}`}
                    role="status"
                    aria-live="polite"
                >
                    {pendingPayments.length} pending
                </span>
            </header>

            {pendingPayments.length > 0 && (
                <div className={styles.toolbar}>
                    <div className={styles.filterField}>
                        <label htmlFor="pending-sort">Sort by</label>
                        <select
                            id="pending-sort"
                            value={pendingSort}
                            onChange={(event) => setPendingSort(event.target.value as SortOption)}
                        >
                            <option value="date-desc">Newest first</option>
                            <option value="date-asc">Oldest first</option>
                            <option value="amount-desc">Amount: high to low</option>
                            <option value="amount-asc">Amount: low to high</option>
                        </select>
                    </div>
                </div>
            )}

            <div className={styles.list}>
                {sortedPendingPayments.length > 0 ? sortedPendingPayments.map((payment) => (
                    <article className={styles.card} key={payment.id} aria-labelledby={`${payment.id}-recipient`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={`${styles.paymentId} ${styles[`status-${payment.status}`]}`}>
                                    {statusLabels[payment.status]}
                                </p>
                                <h2 id={`${payment.id}-recipient`}>{payment.recipient}</h2>
                            </div>
                            <strong>{formatAmount(payment)}</strong>
                        </div>
                        <dl className={styles.details}>
                            <div><dt>Reference</dt><dd>{payment.reference}</dd></div>
                            <div><dt>Submitted by</dt><dd>{payment.submittedBy}</dd></div>
                            <div><dt>Submitted</dt><dd>{payment.submittedAt}</dd></div>
                            <div><dt>To IBAN</dt><dd>{payment.toIban}</dd></div>
                            <div><dt>From account</dt><dd>{payment.fromAccount}</dd></div>
                        </dl>
                        <div className={styles.commentField}>
                            <label htmlFor={`${payment.id}-comment`}>Comment (optional)</label>
                            <textarea
                                id={`${payment.id}-comment`}
                                value={payment.comment ?? ''}
                                onChange={(event) => updateComment(payment.id, event.target.value)}
                                rows={2}
                                maxLength={COMMENT_MAX_LENGTH}
                                placeholder="Add a comment"
                            />
                            <span className={styles.commentCount}>
                                {(payment.comment?.length ?? 0)}/{COMMENT_MAX_LENGTH}
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.reject}
                                onClick={(event) => handleReject(payment, event)}
                                aria-label={`Reject payment to ${payment.recipient}`}
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                className={styles.approve}
                                onClick={(event) => handleApprove(payment, event)}
                                aria-label={`Approve payment to ${payment.recipient}`}
                            >
                                Approve
                            </button>
                        </div>
                    </article>
                )) : (
                    <div className={styles.emptyState}>
                        <h2>No pending approvals</h2>
                        <p>There are no payments waiting for your approval.</p>
                    </div>
                )}
            </div>

            <section className={styles.historySection} aria-labelledby="history-title">
                <h2 id="history-title" className={styles.historyTitle}>Recently handled</h2>
                {handledPayments.length > 0 && (
                    <div className={styles.toolbar}>
                        <div className={styles.filterField}>
                            <label htmlFor="history-status">Status</label>
                            <select
                                id="history-status"
                                value={historyStatusFilter}
                                onChange={(event) => setHistoryStatusFilter(event.target.value as HistoryStatusFilter)}
                            >
                                <option value="all">All</option>
                                <option value="completed">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div className={styles.filterField}>
                            <label htmlFor="history-sort">Sort by</label>
                            <select
                                id="history-sort"
                                value={historySort}
                                onChange={(event) => setHistorySort(event.target.value as SortOption)}
                            >
                                <option value="date-desc">Newest first</option>
                                <option value="date-asc">Oldest first</option>
                                <option value="amount-desc">Amount: high to low</option>
                                <option value="amount-asc">Amount: low to high</option>
                            </select>
                        </div>
                    </div>
                )}
                <div className={styles.tableWrapper}>
                    <table className={styles.historyTable}>
                        <caption className={styles.visuallyHidden}>Recently handled payments</caption>
                        <thead>
                            <tr>
                                <th scope="col">Reference</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Status</th>
                                <th scope="col">Handled</th>
                                <th scope="col">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHandledPayments.length > 0 ? sortedHandledPayments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{payment.reference}</td>
                                    <td>{formatAmount(payment)}</td>
                                    <td>
                                        <span className={`${styles.statusPill} ${styles[`status-${payment.status}`]}`}>
                                            {statusLabels[payment.status]}
                                        </span>
                                    </td>
                                    <td>{payment.decidedAt ?? '—'}</td>
                                    <td>{payment.comment || '—'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td className={styles.historyEmpty} colSpan={5}>
                                        {handledPayments.length === 0 ? 'No payments handled yet.' : 'No payments match this filter.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {confirmAction && (
                <div className={styles.modalOverlay} onClick={closeConfirm}>
                    <div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        onClick={(event) => event.stopPropagation()}
                        ref={modalRef}
                    >
                        <h2 id="confirm-modal-title">
                            {confirmLabel} payment?
                        </h2>
                        <p>
                            {confirmLabel} payment of{' '}
                            <strong>{formatAmount(confirmAction.payment)}</strong> to{' '}
                            <strong>{confirmAction.payment.recipient}</strong>?
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={styles.modalCancel}
                                onClick={closeConfirm}
                                ref={cancelButtonRef}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={confirmAction.kind === 'approve' ? styles.approve : styles.reject}
                                onClick={handleConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
