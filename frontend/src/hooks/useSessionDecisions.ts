import { useQuery, type QueryClient } from "@tanstack/react-query";

import type { DecidedApproval } from "../schemas/approvalHistorySchema";

// Decisions made since the page was opened, kept only in memory (React Query cache).
// A stand-in for the "Handled" tab until the backend has GET /api/Approval/history.
// Keyed by user id, so another user logging in in the same tab never sees them.
// Deliberately not under ["approvalHistory"]: invalidating the real history after a decision
// would otherwise also reset this list (query keys match by prefix) and empty it.
function sessionDecisionsKey(userId: number | undefined) {
    return ["approvalSessionDecisions", userId] as const;
}

export function useSessionDecisions(userId: number | undefined) {
    const { data = [] } = useQuery<DecidedApproval[]>({
        queryKey: sessionDecisionsKey(userId),
        // Nothing to fetch: the list is only filled by addSessionDecision.
        queryFn: () => [],
        initialData: [],
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return data;
}

export function addSessionDecision(
    queryClient: QueryClient,
    userId: number | undefined,
    decision: DecidedApproval
) {
    queryClient.setQueryData<DecidedApproval[]>(sessionDecisionsKey(userId), (current = []) => [
        decision,
        ...current.filter((item) => item.stepId !== decision.stepId),
    ]);
}
