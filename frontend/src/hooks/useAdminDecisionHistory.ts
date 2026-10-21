import { useQuery } from "@tanstack/react-query";

import { fetchAuditLog, fetchEntityHistory } from "../services/auditService";
import {
    createPaymentDetailsSchema,
    stepDecisionDetailsSchema,
    type AuditEntry,
} from "../schemas/auditSchema";
import type { DecidedApproval } from "../schemas/approvalHistorySchema";
import { APPROVAL_HISTORY_QUERY_KEY, useApprovalHistory } from "./useApprovalHistory";

// The backend's page size cap.
const MAX_ENTRIES = 200;

// An admin is never the assigned attestant of a step, so /api/Approval/history is always empty
// for them, even for the payments they approved themselves. The audit log does record who decided,
// so the admin's "Handled" tab is built from it: their own APPROVE_STEP / REJECT_STEP entries,
// completed with the reference and recipient from each payment's CREATE_PAYMENT entry.
// Replace with /api/Approval/history once the backend stores who decided a step.
async function fetchAdminDecisions(userPublicId: string): Promise<DecidedApproval[]> {
    const [approved, rejected] = await Promise.all([
        fetchAuditLog({ userPublicId, action: "APPROVE_STEP" }, 1, MAX_ENTRIES),
        fetchAuditLog({ userPublicId, action: "REJECT_STEP" }, 1, MAX_ENTRIES),
    ]);
    const decisions = [...approved.items, ...rejected.items];

    // One request per payment, not per decision.
    const paymentIds = [...new Set(decisions.map((entry) => entry.entityId))];
    const histories = await Promise.all(
        paymentIds.map((id) => fetchEntityHistory("payment", id))
    );
    const createdByPayment = new Map<number, AuditEntry>();
    histories.forEach((history, index) => {
        const created = history.items.find((entry) => entry.action === "CREATE_PAYMENT");
        if (created) createdByPayment.set(paymentIds[index], created);
    });

    return decisions.flatMap((entry) => {
        const decision = stepDecisionDetailsSchema.safeParse(entry.details);
        const created = createdByPayment.get(entry.entityId);
        const payment = createPaymentDetailsSchema.safeParse(created?.details);

        // Without the creation event there is no reference or recipient to show.
        if (!decision.success || !created || !payment.success) return [];

        return [{
            stepId: String(entry.id),
            stepNumber: decision.data.stepNumber ?? 1,
            paymentId: String(entry.entityId),
            reference: payment.data.reference,
            amount: decision.data.amount,
            currency: decision.data.currency,
            toIban: payment.data.toIban,
            createdByUserName: created.userName,
            paymentCreatedAt: created.timeStamp,
            decision: decision.data.decision,
            comment: decision.data.comment ?? null,
            decidedAt: entry.timeStamp,
        }];
    });
}

// Under the history key, so it is refreshed together with it after every decision.
export function useAdminDecisionHistory(userPublicId: string | undefined) {
    return useQuery({
        queryKey: [...APPROVAL_HISTORY_QUERY_KEY, "admin", userPublicId],
        queryFn: () => fetchAdminDecisions(userPublicId!),
        enabled: userPublicId !== undefined,
    });
}

// The "Handled" list for whoever is logged in: the history endpoint for attestants,
// the audit log for admins. Both hooks are always called, only one is enabled.
export function useHandledHistory(user: { id: string; role: string } | null | undefined) {
    const isAdmin = user?.role === "Admin";
    const attestantHistory = useApprovalHistory(!isAdmin);
    const adminHistory = useAdminDecisionHistory(isAdmin ? user?.id : undefined);

    return isAdmin ? adminHistory : attestantHistory;
}
