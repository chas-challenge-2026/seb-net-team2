import type { Notification } from "../types/notifications";

const mockNotifications: Notification[] = [
    {
        id: 'notification-1',
        title: 'Payment requires approval',
        message: 'A payment of 75 000 is waiting for your approval',
        type: 'approval',
        createdAt: '2026-09-22',
        isRead: false,
        href: '/attestkorg',


    },
    {
        
        id: 'notification-2',
        title: 'Payment created',
        message: 'Your payment has been created and is awaiting processing.',
        type: 'payment',
        createdAt: '2026-09-22T08:15:00Z',
        isRead: true,
        href: '/dashboard',
    },
]

export async function fetchNotifications(): Promise<Notification[]> {
    return mockNotifications
}