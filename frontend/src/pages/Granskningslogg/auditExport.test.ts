import { describe, expect, it } from "@jest/globals";
import i18n from "i18next";

import { auditCsvRows, toCsv } from "./auditExport";

const t = i18n.t.bind(i18n);

describe("toCsv", () => {
    it("separates with semicolons and starts with a byte order mark for Excel", () => {
        expect(toCsv([["Tid", "Användare"], ["18:52", "Sara Ek"]]))
            .toBe("﻿Tid;Användare\r\n18:52;Sara Ek");
    });

    it("quotes values that contain semicolons, quotes or line breaks", () => {
        expect(toCsv([['Säger "ja"; ok', "rad 1\nrad 2"]]))
            .toBe('﻿"Säger ""ja""; ok";"rad 1\nrad 2"');
    });
});

describe("auditCsvRows", () => {
    it("writes the same readable texts as the table, with the payment's reference", () => {
        const entries = [
            {
                id: 2, timeStamp: "2026-10-13T16:52:00Z", userId: 5, userName: "Sara Ek",
                action: "APPROVE_STEP", entityType: "payment", entityId: 21, description: "Steg 2 för betalning 21 godkändes",
                details: { decision: "approved", stepNumber: 2, totalSteps: 2, comment: "Stämmer" },
            },
            {
                id: 1, timeStamp: "2026-10-13T09:10:00Z", userId: 2, userName: "Lisa Persson",
                action: "CREATE_PAYMENT", entityType: "payment", entityId: 21, description: "Skapade betalning",
                details: { amount: 300000, currency: "SEK", toIban: "SE1850000000058398257467", reference: "1050" },
            },
        ];

        const [header, approved, created] = auditCsvRows(entries, new Map(), t, "sv-SE");

        expect(header).toEqual(["Tid", "Användare", "Händelse", "Entitet", "Beskrivning", "Kommentar"]);
        expect(approved.slice(1)).toEqual(["Sara Ek", "Godkänd", "Betalning 1050", "Steg 2 av 2", "Stämmer"]);
        expect(created[4]).toMatch(/^300\s000,00 SEK till SE18 5000 0000 0583 9825 7467 · SEB$/);
    });
});
