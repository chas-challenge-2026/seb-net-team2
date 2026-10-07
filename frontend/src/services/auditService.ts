import { apiRequest } from "./apiRequest";
import { auditPageSchema } from "../schemas/auditSchema";

const API_URL = import.meta.env.VITE_API_URL;

// Mirrors backend/SebPortal/Models/AuditActions.cs. The API has no endpoint that lists them.
export const AUDIT_ACTIONS = [
    "CREATE_PAYMENT",
    "APPROVE_STEP",
    "REJECT_STEP",
    "EXECUTE_PAYMENT",
    "REJECT_PAYMENT",
    "CREATE_USER",
    "UPDATE_USER",
    "DELETE_USER",
    "CREATE_APPROVAL_LIMIT",
    "UPDATE_APPROVAL_LIMIT",
    "DELETE_APPROVAL_LIMIT",
] as const;

export type AuditLogFilters = {
    userId?: number;
    action?: string;
    // Inclusive dates in yyyy-MM-dd format.
    from?: string;
    to?: string;
};

export async function fetchAuditLog(
    filters: AuditLogFilters,
    page: number,
    pageSize: number
) {
    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (filters.userId !== undefined) params.set("userId", String(filters.userId));
    if (filters.action) params.set("action", filters.action);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    return apiRequest(`${API_URL}/api/audit?${params}`, auditPageSchema);
}

// Full history for one item, e.g. payment 4. 200 is the backend's page size cap,
// which is far more events than a single payment gets.
export async function fetchEntityHistory(entityType: string, entityId: number) {
    return apiRequest(
        `${API_URL}/api/audit/${encodeURIComponent(entityType)}/${entityId}?pageSize=200`,
        auditPageSchema
    );
}
