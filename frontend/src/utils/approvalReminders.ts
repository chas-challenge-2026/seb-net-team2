import type { Payment } from '../services/approvalService'

export const OVERDUE_AFTER_DAYS = 2
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysWaiting(payment: Payment): number {
    const submitted = new Date(payment.submittedAt).getTime()
    if (Number.isNaN(submitted)) return 0
    return Math.floor((Date.now() - submitted) / MS_PER_DAY)
}

export function isOverdue(payment: Payment): boolean {
    return payment.status === 'pending' && daysWaiting(payment) > OVERDUE_AFTER_DAYS
}

export function countOverdue(payments: Payment[] | undefined): number {
    return (payments ?? []).filter(isOverdue).length
}
