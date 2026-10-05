import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchAuditLog, type AuditLogFilters } from "../services/auditService";

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
