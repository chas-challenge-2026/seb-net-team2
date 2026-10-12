import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { fetchNotifications, markNotificationAsRead } from "../../services/notificationService";
import type { Notification, NotificationType } from "../../types/notifications";

import styles from "./NotificationBell.module.css";

const typeIcons: Record<NotificationType, string> = {
    payment: "💳",
    approval: "✅",
    system: "ℹ️",
};

export function NotificationBell() {
    const { t } = useTranslation();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [actionError, setActionError] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        let isCurrent = true;

        void fetchNotifications()
            .then((items) => {
                if (isCurrent) setNotifications(items);
            })
            .catch(() => {
                if (isCurrent) setLoadError(true);
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    async function markAsRead(notificationId: string) {
        const notification = notifications.find((item) => item.id === notificationId);
        if (!notification || notification.isRead) return;

        setActionError(false);
        setNotifications((current) =>
            current.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
        try {
            await markNotificationAsRead(notificationId);
        } catch {
            setNotifications((current) =>
                current.map((item) =>
                    item.id === notificationId
                        ? { ...item, isRead: notification.isRead }
                        : item
                )
            );
            setActionError(true);
        }
    }

    async function markAllAsRead() {
        const unreadNotifications = notifications.filter((notification) => !notification.isRead);
        if (unreadNotifications.length === 0) return;

        const previousNotifications = notifications;
        setActionError(false);
        setNotifications((current) =>
            current.map((notification) => ({
                ...notification,
                isRead: true,
            }))
        );

        const results = await Promise.allSettled(
            unreadNotifications.map((notification) => markNotificationAsRead(notification.id))
        );

        if (results.some((result) => result.status === "rejected")) {
            setActionError(true);
            try {
                setNotifications(await fetchNotifications());
            } catch {
                setNotifications(previousNotifications);
            }
        }
    }

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                className={styles.button}
                onClick={() => setIsOpen((current) => !current)}
                aria-label={t("notifications.buttonLabel", { count: unreadCount })}
                aria-controls="notifications-panel"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <svg
                    className={styles.buttonIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                    <span className={styles.badge}>
                        {unreadCount}
                    </span>
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
                            <h2 id="notifications-title">
                                {t("notifications.title")}
                            </h2>

                            <span aria-live="polite">
                                {t("notifications.unreadCount", { count: unreadCount })}
                            </span>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className={styles.markAllButton}
                                onClick={markAllAsRead}
                            >
                                {t("notifications.markAllAsRead")}
                            </button>
                        )}
                    </div>

                    {loadError && (
                        <p role="alert" className={styles.loadError}>
                            {t("notifications.loadError")}
                        </p>
                    )}

                    {actionError && (
                        <p role="alert" className={styles.loadError}>
                            {t("notifications.updateError")}
                        </p>
                    )}

                    {isLoading ? (
                        <p role="status" className={styles.empty}>{t("notifications.loading")}</p>
                    ) : loadError ? null : notifications.length === 0 ? (
                        <div className={styles.empty}>
                            <span aria-hidden="true">🔕</span>
                            <p>{t("notifications.empty")}</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    to={notification.href ?? "/dashboard"}
                                    className={`${styles.item} ${!notification.isRead ? styles.unread : ""
                                        }`}
                                    onClick={() => {
                                        markAsRead(notification.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span
                                        className={styles.itemIcon}
                                        aria-hidden="true"
                                    >
                                        {typeIcons[notification.type]}
                                    </span>

                                    <span className={styles.itemBody}>
                                        <strong>{t(notification.title)}</strong>
                                        <span>{notification.message}</span>
                                        <small>{notification.createdAt}</small>
                                    </span>

                                    {!notification.isRead && (
                                        <span
                                            className={styles.unreadDot}
                                            aria-hidden="true"
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}