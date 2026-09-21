import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog } from "../services/auditService";

export function useAuditLog() {
    return useQuery({
        queryKey: ['auditLog'],
        queryFn: fetchAuditLog,
    })
}
