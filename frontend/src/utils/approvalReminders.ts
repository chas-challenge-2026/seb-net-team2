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
