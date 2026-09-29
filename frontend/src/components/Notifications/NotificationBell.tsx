import { useEffect, useRef, useState } from "react";
import { Link } from '@tanstack/react-router'
import { fetchNotifications } from "../../services/notificationService";
import type { Notification, NotificationType } from "../../types/notifications";
import styles from './NotificationBell.module.css'

const typeIcons: Record<NotificationType, string> = {
    payment: '💳',
    approval: '✅',
    system: 'ℹ️',
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        void fetchNotifications().then(setNotifications)
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false)
                buttonRef.current?.focus()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    function markAsRead(notificationId: string) {
        setNotifications(current =>
            current.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification,
            ),
        )
    }

    function markAllAsRead() {
        setNotifications(current =>
            current.map(notification => ({ ...notification, isRead: true })),
        )
    }

    const unreadCount = notifications.filter(
        notification => !notification.isRead,
    ).length

    return (
        <div className={styles.container} ref={containerRef}>
            <button
            ref={buttonRef}
            type="button"
            className={styles.button}
            onClick={() => setIsOpen(current => !current)}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-controls="notifications-panel"
            aria-expanded={isOpen}
            aria-haspopup="true"
            >
                <svg
                    className={styles.buttonIcon}
                    viewBox="0 0 24 24"
                    aria-hidden='true'
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 8a6 6 0 1 1 12 0c0 3.5 1 5.5 1.5 6.5H4.5C5 13.5 6 11.5 6 8Z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 18a2 2 0 0 0 4 0"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div
                    className={styles.panel}
                    id="notifications-panel"
                    role="region"
                    aria-labelledby="notifications-title"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelHeaderTitle}>
                            <h2 id="notifications-title">Notifications</h2>
                            <span aria-live="polite">{unreadCount} unread</span>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className={styles.markAllButton}
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <span aria-hidden='true'>🔕</span>
                            <p>You have no notifications.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {notifications.map(notification => (
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
                                    <span className={styles.itemIcon} aria-hidden='true'>
                                        {typeIcons[notification.type]}
                                    </span>

                                    <span className={styles.itemBody}>
                                        <strong>{notification.title}</strong>
                                        <span>{notification.message}</span>
                                        <small>{notification.createdAt}</small>
                                    </span>

                                    {!notification.isRead && (
                                        <span className={styles.unreadDot} aria-hidden='true' />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                </div>
            )}

        </div>
    )


}

