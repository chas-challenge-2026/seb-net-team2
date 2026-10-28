import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { fetchNotifications, markNotificationAsRead } from "../../services/notificationService";
import { fetchPendingApprovals } from "../../services/approvalService";
import { useAuth } from "../../hooks/useAuth";
import { APPROVALS_QUERY_KEY } from "../../hooks/useApprovals";
import type { Notification, NotificationType } from "../../types/notifications";
import { translateSystemText } from "../../i18n/translateSystemText";

import styles from "./NotificationBell.module.css";

const typeIcons: Record<NotificationType, string> = {
    payment: "💳",
    approval: "✅",
    system: "ℹ️",
};

export function NotificationBell() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const canWatchApprovals = user?.role === "Attestant" || user?.role === "Admin";
    const { data: pendingApprovals, isError: approvalWatchError } = useQuery({
        queryKey: APPROVALS_QUERY_KEY,
        queryFn: fetchPendingApprovals,
        enabled: canWatchApprovals,
        refetchInterval: 15_000,
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [actionError, setActionError] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const previousPendingIdsRef = useRef<Set<string> | null>(null);

    useEffect(() => {
        if (!canWatchApprovals) {
            previousPendingIdsRef.current = null;
            return;
        }

        if (!pendingApprovals) return;

        const currentIds = new Set(pendingApprovals.map((approval) => approval.stepId));
        const previousIds = previousPendingIdsRef.current;

        const newNotifications: Notification[] = pendingApprovals
            .filter((approval) => !previousIds?.has(approval.stepId))
            .map((approval) => ({
                id: `pending:${approval.stepId}`,
                title: "notifications.approvalTitle",
                message: approval.reference || approval.paymentId,
                type: "approval",
                createdAt: new Date().toISOString(),
                isRead: false,
                href: "/attestkorg",
            }));

        if (newNotifications.length > 0) {
            setNotifications((current) => {
                const currentIds = new Set(current.map((notification) => notification.id));
                return [
                    ...newNotifications.filter((notification) => !currentIds.has(notification.id)),
                    ...current,
                ];
            });
        }

        previousPendingIdsRef.current = currentIds;
    }, [canWatchApprovals, pendingApprovals]);

    useEffect(() => {
        let isCurrent = true;

        function loadNotifications() {
            void fetchNotifications(user?.role)
                .then((items) => {
                    if (!isCurrent) return;
                    setLoadError(false);
                    setNotifications((current) => [
                        ...current.filter((notification) =>
                            canWatchApprovals && notification.id.startsWith("pending:")
                        ),
                        ...items,
                    ]);
                })
                .catch(() => {
                    if (isCurrent) setLoadError(true);
                })
                .finally(() => {
                    if (isCurrent) setIsLoading(false);
                });
        }

        loadNotifications();
        const timer = window.setInterval(loadNotifications, 15_000);

        return () => {
            isCurrent = false;
            window.clearInterval(timer);
        };
    }, [canWatchApprovals, user?.role]);

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
        if (notification.id.startsWith("pending:")) return;

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
            unreadNotifications
                .filter((notification) => !notification.id.startsWith("pending:"))
                .map((notification) => markNotificationAsRead(notification.id))
        );

        if (results.some((result) => result.status === "rejected")) {
            setActionError(true);
            try {
                setNotifications(await fetchNotifications(user?.role));
            } catch {
                setNotifications(previousNotifications);
            }
        }
    }

    const visibleNotifications = user?.role === "Initiator"
        ? notifications.filter((notification) => notification.type === "payment")
        : notifications;
    const unreadCount = visibleNotifications.filter(
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

                    {approvalWatchError && (
                        <p role="alert" className={styles.loadError}>
                            {t("notifications.approvalWatchError")}
                        </p>
                    )}

                    {actionError && (
                        <p role="alert" className={styles.loadError}>
                            {t("notifications.updateError")}
                        </p>
                    )}

                    {isLoading && visibleNotifications.length === 0 ? (
                        <p role="status" className={styles.empty}>{t("notifications.loading")}</p>
                    ) : visibleNotifications.length === 0 ? (
                        <div className={styles.empty}>
                            <span aria-hidden="true">🔕</span>
                            <p>{t("notifications.empty")}</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {visibleNotifications.map((notification) => (
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
                                        <span>{notification.id.startsWith("pending:")
                                            ? t("notifications.newApprovalMessage", { reference: notification.message })
                                            : translateSystemText(notification.message, t)}</span>
                                        <small>{new Date(notification.createdAt).toLocaleString(
                                            i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-GB",
                                        )}</small>
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
