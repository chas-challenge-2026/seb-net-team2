import { apiRequest } from "./apiRequest";
import z from "zod";

import { pendingApprovalStepsSchema } from "../schemas/pendingApprovalSchema";
import { createdPaymentSchema } from "../schemas/paymentSchema";
import type { ApprovalDecision } from "../schemas/approvalDecisionSchema";

const API_URL =
    import.meta.env.VITE_API_URL;

export async function fetchPendingApprovals() {
    return apiRequest(
        `${API_URL}/api/Approval/pending`,
        pendingApprovalStepsSchema,
    );
}

// The pending list doesn't include which account the money is taken from, but the
// payment itself does. The backend only returns payments from the user's own company.
export async function fetchPaymentById(paymentId: number) {
    return apiRequest(
        `${API_URL}/api/Payment/${paymentId}`,
        createdPaymentSchema,
    );
}

export async function decideApproval(
    decision: ApprovalDecision
) {
    return apiRequest(
        `${API_URL}/api/Approval/decide`,
        z.void(),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(decision),
        }
    );
}