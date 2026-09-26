import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useApprovals } from '../../hooks/useApprovals'
import { useAuth } from '../../hooks/useAuth'
import { OVERDUE_AFTER_DAYS, countOverdue } from '../../utils/approvalReminders'
import styles from './OverdueReminder.module.css'

// Shown once per browser session, so the reminder doesn't nag on every page change.
const DISMISSED_KEY = 'overdueReminderDismissed'

function readDismissed(): boolean {
    try {
        return sessionStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
        return false
    }
}

function saveDismissed() {
    try {
        sessionStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
        // Storage can be unavailable (e.g. private mode); the toast then just reappears next load.
    }
}

export function OverdueReminder() {
    const { user } = useAuth()
    const { data: approvals } = useApprovals()
    const [dismissed, setDismissed] = useState(readDismissed)
    const pathname = useRouterState({ select: (state) => state.location.pathname })

    const canApprove = user?.role === 'Attestant' || user?.role === 'Admin'
    const overdueCount = countOverdue(approvals)

    // The approval inbox shows its own banner, so the toast would be redundant there.
    if (!canApprove || dismissed || overdueCount === 0 || pathname === '/attestkorg') {
        return null
    }

    function dismiss() {
        saveDismissed()
        setDismissed(true)
    }

    return (
        <div className={styles.toast} role="status" aria-live="polite">
            <div className={styles.body}>
                <strong className={styles.title}>Reminder: approvals waiting</strong>
                <p className={styles.message}>
                    {overdueCount === 1
                        ? '1 payment has'
                        : `${overdueCount} payments have`} been waiting more than {OVERDUE_AFTER_DAYS} days for your approval.
                </p>
                <Link to="/attestkorg" className={styles.link} onClick={dismiss}>
                    Go to approval inbox
                </Link>
            </div>
            <button
                type="button"
                className={styles.close}
                onClick={dismiss}
                aria-label="Dismiss reminder"
            >
                ×
            </button>
        </div>
    )
}
