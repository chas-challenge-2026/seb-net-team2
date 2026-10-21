import { describe, expect, it } from "@jest/globals";

import { currentUserSchema, loginResponseSchema } from "./userSchema";

describe("authentication response schemas", () => {
    it("accepts the UUID user identifiers returned by the backend", () => {
        const userId = "c6a91a61-a18a-41ca-a2f7-7937cd187425";

        expect(loginResponseSchema.parse({
            token: "access-token",
            refreshToken: "refresh-token",
            userId,
            email: "lisa@malmobygg.se",
            role: "Initiator",
            tenantId: 1,
        }).userId).toBe(userId);

        expect(currentUserSchema.parse({
            id: userId,
            name: "Lisa Persson",
            email: "lisa@malmobygg.se",
            role: "Initiator",
            tenantId: 1,
            tenantName: "Malmö Bygg AB",
            pendingApprovalsCount: 0,
        }).id).toBe(userId);
    });
});