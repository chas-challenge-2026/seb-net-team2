import { z } from "zod";
import { apiRequest } from "./apiRequest";
import type { Notification } from "../types/notifications";
import type { UserRole } from "../schemas/userSchema";

const notificationDtoSchema = z.object({
    id: z.number(),
    paymentId: z.number(),
    message: z.string(),
    isRead: z.boolean(),
    createdAt: z.string(),
});

const notificationListSchema = z.array(notificationDtoSchema);
const emptyResponseSchema = z.undefined();

export async function fetchNotifications(role?: UserRole): Promise<Notification[]> {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

    const data = await apiRequest(
        `${apiUrl}/api/Notifications`,
        notificationListSchema,
    );

    const notifications = data.map((item): Notification => {
        const isPaymentDecision = /\b(godkänts|avslagits|approved|rejected)\b/i.test(item.message);

        return {
            id: String(item.id),
            title: isPaymentDecision ? "notifications.paymentStatusTitle" : "notifications.approvalTitle",
            message: item.message,
            type: isPaymentDecision ? "payment" : "approval",
            createdAt: item.createdAt,
            isRead: item.isRead,
            href: isPaymentDecision ? "/dashboard" : "/attestkorg",
        };
    });

    return role === "Initiator"
        ? notifications.filter((notification) => notification.type === "payment")
        : notifications;
}

export async function markNotificationAsRead(id: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

    await apiRequest(
        `${apiUrl}/api/Notifications/${id}/read`,
        emptyResponseSchema,
        { method: "PATCH" },
    );
}