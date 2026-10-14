import { describe, expect, it } from "@jest/globals";
import i18n from "i18next";

import { describeEntry, groupByDay } from "./auditFormat";

const t = i18n.t.bind(i18n);

describe("describeEntry", () => {
    it("formats a payment's amount and IBAN instead of showing the raw backend text", () => {
        const summary = describeEntry(
            "EXECUTE_PAYMENT",
            { amount: 300000, currency: "SEK", toIban: "SE1850000000058398257467" },
            t,
            "sv-SE"
        );

        expect(summary).toMatch(/^300\s000,00 SEK till SE18 5000 0000 0583 9825 7467 · SEB$/);
    });

    it("describes a rejected payment's refund", () => {
        const summary = describeEntry("REJECT_PAYMENT", { amount: 250000, currency: "SEK" }, t, "sv-SE");

        expect(summary).toMatch(/^250\s000,00 SEK återfördes till kontot$/);
    });

    it("adds nothing for approval decisions, whose event and step already say it all", () => {
        expect(describeEntry("APPROVE_STEP", { decision: "approved" }, t, "sv-SE")).toBe("");
    });

    it("falls back to the backend description when an entry has no details", () => {
        expect(describeEntry("CREATE_PAYMENT", null, t, "sv-SE")).toBeNull();
        expect(describeEntry("CREATE_USER", { name: "Anna" }, t, "sv-SE")).toBeNull();
    });
});

describe("groupByDay", () => {
    it("puts newest-first events under one heading per day", () => {
        const entries = [
            { id: 3, timeStamp: "2026-10-13T16:52:00" },
            { id: 2, timeStamp: "2026-10-13T09:10:00" },
            { id: 1, timeStamp: "2026-10-07T17:09:00" },
        ];

        const groups = groupByDay(entries, "sv-SE");

        expect(groups.map((group) => group.label)).toEqual(["13 oktober 2026", "7 oktober 2026"]);
        expect(groups.map((group) => group.entries.map((entry) => entry.id))).toEqual([[3, 2], [1]]);
    });
});
