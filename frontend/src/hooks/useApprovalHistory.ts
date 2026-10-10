import { useQuery } from "@tanstack/react-query";

import { AppError } from "../errors/AppError";
import { fetchDecisionHistory } from "../services/approvalService";

export const APPROVAL_HISTORY_QUERY_KEY = ["approvalHistory"];

// True when the backend doesn't have the history endpoint yet.
export function isHistoryUnavailable(error: unknown): boolean {
    return error instanceof AppError && (error.status === 404 || error.status === 405);
}

// Only fetched when the "Handled" tab is opened.
export function useApprovalHistory(enabled: boolean) {
    return useQuery({
        queryKey: APPROVAL_HISTORY_QUERY_KEY,
        queryFn: fetchDecisionHistory,
        enabled,
        // A missing endpoint won't appear by retrying, so don't make the user wait for retries.
        retry: (failureCount, error) => !isHistoryUnavailable(error) && failureCount < 3,
    });
}
