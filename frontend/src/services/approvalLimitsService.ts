import { z } from "zod";

import { apiRequest } from "./apiRequest";

import {
    approvalLimitSchema,
    approvalLimitsSchema,
} from '../schemas/approvalLimitsSchema';

import type {
    CreateApprovalLimit,
    UpdateApprovalLimit,
} from '../schemas/approvalLimitsSchema';

const API_URL =
    import.meta.env.VITE_API_URL;

export async function getApprovalLimits() {
    return apiRequest(
        `${API_URL}/api/ApprovalLimits`,
        approvalLimitsSchema
    );
}

export async function createApprovalLimit(
    limit: CreateApprovalLimit
) {
    return apiRequest(
        `${API_URL}/api/ApprovalLimits`,
        approvalLimitSchema,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(limit),
        }
    );
}

export async function updateApprovalLimit(
    id: number,
    limit: UpdateApprovalLimit
) {
    return apiRequest(
        `${API_URL}/api/ApprovalLimits/${id}`,
        approvalLimitSchema,
        {
            method: "PATCH",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify(limit),
        }
    );
}

export async function deleteApprovalLimit(
    id: number
): Promise<void> {
    return apiRequest(
        `${API_URL}/api/ApprovalLimits/${id}`,
        z.void(),
        {
            method: "DELETE",
        }
    );
}