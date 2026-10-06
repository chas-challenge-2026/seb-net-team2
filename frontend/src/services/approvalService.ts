import { apiRequest } from "./apiRequest";
import z from "zod";

import { pendingApprovalStepsSchema } from "../schemas/pendingApprovalSchema";
import type { ApprovalDecision } from "../schemas/approvalDecisionSchema";

const API_URL =
    import.meta.env.VITE_API_URL;

export async function fetchPendingApprovals() {
    return apiRequest(
        `${API_URL}/api/Approval/pending`,
        pendingApprovalStepsSchema,
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