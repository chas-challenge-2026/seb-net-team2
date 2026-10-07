import type { PendingApprovalStep } from '../schemas/pendingApprovalSchema'

export const OVERDUE_AFTER_DAYS = 2
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysWaiting(approval: PendingApprovalStep): number {
    const created = new Date(approval.paymentCreatedAt).getTime()
    if (Number.isNaN(created)) return 0
    return Math.floor((Date.now() - created) / MS_PER_DAY)
}

// Every step returned by /api/Approval/pending is still waiting, so only the age matters.
export function isOverdue(approval: PendingApprovalStep): boolean {
    return daysWaiting(approval) > OVERDUE_AFTER_DAYS
}

export function countOverdue(approvals: PendingApprovalStep[] | undefined): number {
    return (approvals ?? []).filter(isOverdue).length
}

export type DueStatus = 'pastDue' | 'today' | 'tomorrow' | 'later'

// How close the payment is to its due date, compared by calendar day in the user's time zone.
// Returns null when the payment has no due date.
export function dueStatus(approval: PendingApprovalStep): DueStatus | null {
    if (!approval.dueDate) return null

    const [year, month, day] = approval.dueDate.slice(0, 10).split('-').map(Number)
    if (!year || !month || !day) return null

    const due = new Date(year, month - 1, day).getTime()
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const daysLeft = Math.round((due - today) / MS_PER_DAY)

    if (daysLeft < 0) return 'pastDue'
    if (daysLeft === 0) return 'today'
    if (daysLeft === 1) return 'tomorrow'
    return 'later'
}
