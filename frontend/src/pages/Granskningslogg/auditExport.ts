import type { TFunction } from "i18next";

import { fetchAuditLog, type AuditLogFilters } from "../../services/auditService";
import type { AuditEntry } from "../../schemas/auditSchema";
import { createPaymentDetailsSchema } from "../../schemas/auditSchema";
import { describeEntry, readDecisionDetails } from "./auditFormat";

// The backend's page size cap, and a limit so a huge log can't freeze the browser.
const PAGE_SIZE = 200;
const MAX_ENTRIES = 5000;

// Every event that matches the current filters, not only the rows shown on screen.
export async function fetchAllEntries(filters: AuditLogFilters): Promise<AuditEntry[]> {
    const entries: AuditEntry[] = [];

    for (let page = 1; entries.length < MAX_ENTRIES; page++) {
        const result = await fetchAuditLog(filters, page, PAGE_SIZE);
        entries.push(...result.items);
        if (page * PAGE_SIZE >= result.totalCount || result.items.length === 0) break;
    }

    return entries;
}

// Semicolon-separated with a byte order mark, so Excel with Swedish settings
// opens it in columns and shows å, ä and ö correctly.
export function toCsv(rows: string[][]): string {
    const escape = (value: string) => /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    return "﻿" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
}

export function auditCsvRows(
    entries: AuditEntry[],
    knownReferences: Map<number, string>,
    t: TFunction,
    locale: string
): string[][] {
    // References from the exported events themselves, for payments not shown on screen.
    const references = new Map(knownReferences);
    for (const entry of entries) {
        if (entry.action !== "CREATE_PAYMENT") continue;
        const parsed = createPaymentDetailsSchema.safeParse(entry.details);
        if (parsed.success) references.set(entry.entityId, parsed.data.reference);
    }

    const header = [
        t("auditLog.table.timestamp"),
        t("auditLog.table.user"),
        t("auditLog.table.event"),
        t("auditLog.table.entity"),
        t("auditLog.table.description"),
        t("auditLog.details.comment"),
    ];

    const rows = entries.map((entry) => {
        const { step, totalSteps, comment } = readDecisionDetails(entry.details);
        const summary = describeEntry(entry.action, entry.details, t, locale);
        const stepText = step !== null && totalSteps !== null
            ? t("auditLog.details.step", { step, total: totalSteps })
            : "";
        const reference = entry.entityType === "payment" ? references.get(entry.entityId) : undefined;

        return [
            new Date(entry.timeStamp).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }),
            entry.userName,
            t(`auditLog.actions.${entry.action}`, { defaultValue: entry.action }),
            reference
                ? t("auditLog.entityTypes.paymentReference", { reference })
                : t(`auditLog.entityTypes.${entry.entityType}`, {
                    id: entry.entityId,
                    defaultValue: `${entry.entityType} #${entry.entityId}`,
                }),
            [summary ?? entry.description, stepText].filter(Boolean).join(" · "),
            comment ?? "",
        ];
    });

    return [header, ...rows];
}

export function downloadCsv(csv: string, fileName: string) {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
