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
}