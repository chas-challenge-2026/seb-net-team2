import { useQuery } from "@tanstack/react-query";
import { fetchPendingApprovals } from "../services/approvalService";

export const APPROVALS_QUERY_KEY = ['approvals']

export function useApprovals() {
    return useQuery({
        queryKey: APPROVALS_QUERY_KEY,
        queryFn: fetchPendingApprovals,
    })
}
