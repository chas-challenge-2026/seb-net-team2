import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import {
    fetchAuditLog,
    fetchEntityHistory,
    type AuditLogFilters,
} from "../services/auditService";
import { createPaymentDetailsSchema, type AuditEntry } from "../schemas/auditSchema";

export type AuditEntityRef = {
    entityType: string;
    entityId: number;
    // Shown in the history dialog title, e.g. "Payment 1050". Falls back to the id.
    label?: string;
};

export const AUDIT_LOG_PAGE_SIZE = 20;

// Filtering and paging happen on the server; "Show more" fetches the next page.
// Changing the filters changes the query key, so the list starts again from page 1.
export function useAuditLog(filters: AuditLogFilters) {
    return useInfiniteQuery({
        queryKey: ["auditLog", filters],
        queryFn: ({ pageParam }) => fetchAuditLog(filters, pageParam, AUDIT_LOG_PAGE_SIZE),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page * lastPage.pageSize < lastPage.totalCount
                ? lastPage.page + 1
                : undefined,
    });
}

export function useEntityHistory(entity: AuditEntityRef | null) {
    return useQuery({
        queryKey: ["auditLog", "entity", entity?.entityType, entity?.entityId],
        queryFn: () => fetchEntityHistory(entity!.entityType, entity!.entityId),
        enabled: entity !== null,
    });
}

// "Payment 1050" instead of the database id "Payment #21": the reference is in the payment's
// CREATE_PAYMENT entry. Taken from the loaded rows when possible, otherwise from the payment's
// history, under the same query key as the history dialog so both share the cache.
export function usePaymentReferences(entries: AuditEntry[]): Map<number, string> {
    const known = new Map<number, string>();
    for (const entry of entries) {
        if (entry.entityType !== "payment" || entry.action !== "CREATE_PAYMENT") continue;
        const reference = readReference(entry.details);
        if (reference) known.set(entry.entityId, reference);
    }

    const missing = [...new Set(
        entries
            .filter((entry) => entry.entityType === "payment" && !known.has(entry.entityId))
            .map((entry) => entry.entityId)
    )];

    const histories = useQueries({
        queries: missing.map((paymentId) => ({
            queryKey: ["auditLog", "entity", "payment", paymentId],
            queryFn: () => fetchEntityHistory("payment", paymentId),
            staleTime: 60_000,
        })),
    });

    histories.forEach((history, index) => {
        const created = history.data?.items.find((entry) => entry.action === "CREATE_PAYMENT");
        const reference = readReference(created?.details);
        if (reference) known.set(missing[index], reference);
    });

    return known;
}

function readReference(details: unknown): string | null {
    const parsed = createPaymentDetailsSchema.safeParse(details);
    return parsed.success ? parsed.data.reference : null;
}
