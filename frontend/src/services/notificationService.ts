import { z } from "zod";
import { apiRequest } from "./apiRequest";
import type { Notification } from "../types/notifications";

const notificationDtoSchema = z.object({
    id: z.number(),
    paymentId: z.number(),
    message: z.string(),
    isRead: z.boolean(),
    createdAt: z.string(),
});

const notificationListSchema = z.array(notificationDtoSchema);
const emptyResponseSchema = z.undefined();

export async function fetchNotifications(): Promise<Notification[]> {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

    const data = await apiRequest(
        `${apiUrl}/api/Notifications`,
        notificationListSchema,
    );

    return data.map((item) => ({
        id: String(item.id),
        title: "notifications.approvalTitle",
        message: item.message,
        type: "approval",
        createdAt: item.createdAt,
        isRead: item.isRead,
        href: "/attestkorg",
    }));
}

export async function markNotificationAsRead(id: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

    await apiRequest(
        `${apiUrl}/api/Notifications/${id}/read`,
        emptyResponseSchema,
        { method: "PATCH" },
    );
}