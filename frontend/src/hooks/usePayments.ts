import { useQuery } from "@tanstack/react-query";
import { fetchRecentPayments } from "../services/accountService";

export function usePayments() {
    return useQuery({
        queryKey: ['payments'],
        queryFn: fetchRecentPayments,
    })
}