export type NotificationType = 
| 'payment'
|'approval'
|'system'

export type Notification = {
    id: string
    title: string
    message: string
    type: NotificationType
    createdAt: string
    isRead: boolean
    href?: string
    // Opens the approval inbox at this payment (only for pending approvals).
    paymentId?: string
}

declare module '@tanstack/history' {
    interface HistoryState {
        // Set on every click, so clicking the same notification again still opens the payment.
        notificationClickedAt?: number
    }
}