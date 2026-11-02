import { useQuery } from "@tanstack/react-query";
import { fetchRecentPayments } from "../services/accountService";
import { useAuth } from "./useAuth";

export function usePayments() {
    const { user } = useAuth();
    const scope = user?.role === "Admin" || user?.role === "Attestant" ? "recent" : "mine";
    return useQuery({
        queryKey: ['payments', user?.id, scope],
        queryFn: () => fetchRecentPayments(scope),
        enabled: Boolean(user),
    })
}
