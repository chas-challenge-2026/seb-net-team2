import { useEffect, useState } from "react";
import { Link } from '@tanstack/react-router'
import { fetchNotifications } from "../../services/notificationService";
import type { Notification } from "../../types/notifications";
import styles from './NotificationBell.module.css'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        void fetchNotifications().then(setNotifications)
    }, [])

    function markAsRead(notificationId: string) {
        setNotifications(current =>
            current.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification,
            ),
        )
    }

    const unreadCount = notifications.filter(
        notification => !notification.isRead,
    ).length

    return (
        <div className={styles.container}>
            <button
            type="button"
            className={styles.button}
            onClick={() => setIsOpen(current => !current)}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={isOpen}
            >
                <span aria-hidden='true'>🔔</span>

                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <strong>Notifications</strong>
                        <span>{unreadCount} unread</span>
                    </div>

                    {notifications.length === 0 ? (
                        <p className={styles.empty}>You have no notifications.</p>
                    ) : (
                        notifications.map(notification => (
                            <Link
                            key={notification.id}
                            to={notification.href ?? '/dashboard'}
                            className={`${styles.item} ${
                                !notification.isRead ? styles.unread : ''
                            }`}
                            onClick={() => {
                                markAsRead(notification.id)
                                setIsOpen(false)
                            }}
                            >
                                <strong>{notification.title}</strong>
                                <span>{notification.message}</span>
                                <small>{notification.createdAt}</small>
                            </Link>

                        ))
                    )}

                </div>
            )}

        </div>
    )


}

