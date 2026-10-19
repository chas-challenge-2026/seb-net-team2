import { RequiredMark } from "../../components/FormValidation/RequiredField";
import { focusField } from "../../components/FormValidation/useFormValidation";
import validationStyles from "../../components/FormValidation/FormValidation.module.css";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslatedError } from "../../components/FormValidation/useFormValidation";
import { z } from "zod";
import {
    CircleCheck,
    CircleX,
    Download,
    FileSpreadsheet,
    RotateCcw,
    TriangleAlert,
    Upload,
} from "lucide-react";

import { useAccounts } from "../../hooks/useAccounts";
import { useAuth } from "../../hooks/useAuth";
import { createPayment, type Account } from "../../services/accountService";
import { isValidIban } from "../../schemas/paymentSchema";
import Card from "../../components/Card/Card";
import cardStyles from "../../components/Card/Card.module.css";
import Button from "../../components/Button/Button";

import styles from "./Batch.module.css";

const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const EXPECTED_HEADER = ["from_account_id", "to_iban", "amount", "reference"];
const MAX_REFERENCE_LENGTH = 100;
const EXAMPLE_ACCOUNT_PLACEHOLDER = "<account-iban>";

function normalizeIban(value: string): string {
    return value.replace(/\s/g, "").toUpperCase();
}

function buildExampleCsv(accountIban: string): string {
    return [
        EXPECTED_HEADER.join(","),
        `${accountIban},SE3550000000054910000003,5000.00,Faktura #2001`,
        `${accountIban},SE7850000000054910000005,12500.00,"Malmö Bygg, faktura #2002"`,
    ].join("\n");
}

// The first column may hold the account's IBAN or its ID.
function findAccount(accounts: Account[], value: string): Account | undefined {
    const iban = normalizeIban(value);
    return accounts.find((account) => account.id === value || normalizeIban(account.iban) === iban);
}

type BatchRow = {
    rowNumber: number;
    fromAccountId: string;
    toIban: string;
    amount: number;
    reference: string;
    success: boolean;
    error?: TranslatedError;
};

function splitCsvLines(content: string): string[] {
    return content.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

// RFC 4180 fields within one line: quoted fields may contain commas, and "" inside quotes is a literal quote.
function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            fields.push(field.trim());
            field = "";
        } else {
            field += char;
        }
    }

    fields.push(field.trim());
    return fields;
}

function isValidHeader(headerLine: string): boolean {
    const columns = splitCsvLine(headerLine).map((column) => column.toLowerCase());

    return (
        columns.length === EXPECTED_HEADER.length &&
        columns.every((column, index) => column === EXPECTED_HEADER[index])
    );
}

function parseBatchRows(dataLines: string[], accounts: Account[]): BatchRow[] {
    return dataLines.map((line, index): BatchRow => {
        const rowNumber = index + 2;
        const parts = splitCsvLine(line);

        if (parts.length !== 4) {
            return {
                rowNumber,
                fromAccountId: parts[0] ?? "",
                toIban: parts[1] ?? "",
                amount: 0,
                reference: parts[3] ?? "",
                success: false,
                error: { key: "batch.errors.columns", values: { count: parts.length } },
            };
        }

        const [fromAccountRaw, toIbanRaw, amountRaw, reference] = parts;
        const toIban = normalizeIban(toIbanRaw);
        const fromAccount = findAccount(accounts, fromAccountRaw);

        if (!fromAccount) {
            return {
                rowNumber,
                fromAccountId: fromAccountRaw,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: { key: "batch.errors.unknownAccount", values: { id: fromAccountRaw } },
            };
        }

        const fromAccountId = fromAccount.id;

        if (!isValidIban(toIban)) {
            return {
                rowNumber,
                fromAccountId,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: { key: "batch.errors.invalidIban", values: { iban: toIbanRaw } },
            };
        }

        const amount = Number(amountRaw);

        if (!Number.isFinite(amount) || amount <= 0) {
            return {
                rowNumber,
                fromAccountId,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: { key: "batch.errors.invalidAmount", values: { amount: amountRaw } },
            };
        }

        if (reference.length > MAX_REFERENCE_LENGTH) {
            return {
                rowNumber,
                fromAccountId,
                toIban,
                amount,
                reference,
                success: false,
                error: { key: "payment.errors.referenceTooLong" },
            };
        }

        return { rowNumber, fromAccountId, toIban, amount, reference, success: true };
    });
}

function rowSignature(row: BatchRow): string {
    return [row.rowNumber, row.fromAccountId, row.toIban, row.amount, row.reference].join("|");
}

export function Batch() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { data: accounts = [], isLoading: isLoadingAccounts, isError: accountsError } = useAccounts();

    const [file, setFile] = useState<File | null>(null);
    const [generalError, setGeneralError] = useState<TranslatedError | null>(null);
    const [fileError, setFileError] = useState<TranslatedError | null>(null);
    const [results, setResults] = useState<BatchRow[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultHeadingRef = useRef<HTMLHeadingElement>(null);
    const focusResultsRef = useRef(false);

    // The file input and submit button are disabled while processing, so keyboard focus is lost otherwise.
    useEffect(() => {
        if (results && focusResultsRef.current) {
            focusResultsRef.current = false;
            resultHeadingRef.current?.focus();
        }
    }, [results]);
    // Reused when the same file is retried, so rows that were already created are not created twice.
    const idempotencyKeysRef = useRef(new Map<string, string>());
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";
    const sortedAccounts = [...accounts].sort((a, b) => a.name.localeCompare(b.name, locale));
    const exampleAccount = accounts.reduce<Account | undefined>(
        (richest, account) => (!richest || account.balance > richest.balance ? account : richest),
        undefined
    );
    const exampleCsv = buildExampleCsv(exampleAccount ? normalizeIban(exampleAccount.iban) : EXAMPLE_ACCOUNT_PLACEHOLDER);

    const csvFileSchema = z.object({
        name: z.string().refine(
            (name) => name.toLowerCase().endsWith(".csv"),
            { message: "batch.errors.csvOnly" }
        ),
        size: z.number().max(MAX_FILE_SIZE_BYTES, "batch.errors.fileTooLarge"),
    });

    function reportFileError(message: TranslatedError) {
        setFileError(message);
        requestAnimationFrame(() => focusField("batch-file"));
    }

    function resetFileInput() {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const selected = event.target.files?.[0] ?? null;
        setResults(null);
        setGeneralError(null);

        if (!selected) {
            setFile(null);
            setFileError(null);
            return;
        }

        const result = csvFileSchema.safeParse(selected);

        if (!result.success) {
            setFile(selected);
            reportFileError({ key: result.error.issues[0].message });
            return;
        }

        setFile(selected);
        setFileError(null);
    }

    function handleClear() {
        resetFileInput();
        setFileError(null);
        setGeneralError(null);
        setResults(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            reportFileError({ key: "batch.errors.chooseFile" });
            return;
        }

        if (isLoadingAccounts) {
            setGeneralError({ key: "batch.errors.accountsLoading" });
            return;
        }

        if (accountsError) {
            setGeneralError({ key: "batch.errors.accountsFailed" });
            return;
        }

        const fileValidation = csvFileSchema.safeParse(file);
        if (!fileValidation.success) {
            reportFileError({ key: fileValidation.error.issues[0].message });
            return;
        }
        setFileError(null);
        setGeneralError(null);
        setIsProcessing(true);

        try {
            const content = await file.text();
            const lines = splitCsvLines(content);

            if (lines.length === 0 || !isValidHeader(lines[0])) {
                reportFileError(
                    { key: "batch.errors.header", values: { header: EXPECTED_HEADER.join(",") } }
                );

                return;
            }

            const dataLines = lines.slice(1);

            if (dataLines.length === 0) {
                reportFileError({ key: "batch.errors.empty" });
                return;
            }

            const rows = parseBatchRows(dataLines, accounts);

            if (rows.some(row => !row.success)) {
                setResults(rows);
                reportFileError({ key: "validation.batchRows" });
                return;
            }

            const createdRows = await createPayments(rows);
            focusResultsRef.current = true;
            setResults(createdRows);

            if (createdRows.every(row => row.success)) {
                idempotencyKeysRef.current.clear();
                resetFileInput();
            }
        } catch {
            setGeneralError({ key: "validation.fileRead" });
        } finally {
            setIsProcessing(false);
        }
    }

    async function createPayments(rows: BatchRow[]): Promise<BatchRow[]> {
        const createdRows: BatchRow[] = [];

        for (const row of rows) {
            const signature = rowSignature(row);
            const idempotencyKey = idempotencyKeysRef.current.get(signature) ?? crypto.randomUUID();
            idempotencyKeysRef.current.set(signature, idempotencyKey);

            try {
                await createPayment(
                    {
                        tenantId: user?.tenantId ?? 0,
                        fromAccountId: row.fromAccountId,
                        toIban: row.toIban,
                        amount: row.amount,
                        currency: "SEK",
                        reference: row.reference,
                    },
                    idempotencyKey
                );
                createdRows.push(row);
            } catch (error) {
                createdRows.push({
                    ...row,
                    success: false,
                    error: {
                        key: "batch.errors.createFailed",
                        values: { message: error instanceof Error ? error.message : "" },
                    },
                });
            }
        }

        return createdRows;
    }

    function handleDownloadExample() {
        const blob = new Blob([exampleCsv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "example-batch.csv";
        link.click();

        URL.revokeObjectURL(url);
    }

    const succeeded = results?.filter((row) => row.success).length ?? 0;
    const failed = results ? results.length - succeeded : 0;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>{t("batch.eyebrow")}</span>
                    <div className={styles.titleRow}>
                        <FileSpreadsheet size={28} strokeWidth={2} aria-hidden="true" />
                        <h1>{t("batch.title")}</h1>
                    </div>
                    <p>{t("batch.description")}</p>
                </div>
            </header>

            <div className={styles.layout}>
                <Card>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className={styles.sectionHeading}>
                            <h2>{t("batch.file.title")}</h2>
                            <p>{t("batch.file.description")}</p>
                        </div>

                        <label>
                            {t("batch.file.label")}

                            <RequiredMark />
                            <input
                                id="batch-file"
                                className={validationStyles.control}
                                aria-invalid={Boolean(fileError)}
                                aria-describedby={fileError ? "batch-file-hint batch-file-error" : "batch-file-hint"}
                                disabled={isProcessing}
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                required
                            />
                        </label>

                        <p id="batch-file-hint" className={styles.hint}>{t("batch.file.hint")}</p>

                        {fileError && (
                            <div id="batch-file-error" className={styles.errorBanner} role="alert">
                                <TriangleAlert size={18} aria-hidden="true" />
                                <span>{t(fileError.key, fileError.values)}</span>
                            </div>
                        )}

                        {generalError && <div className={styles.errorBanner} role="alert">{t(generalError.key, generalError.values)}</div>}

                        <div className={styles.actions}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="medium"
                                onClick={handleClear}
                                disabled={!file && !fileError && !results}
                            >
                                <span className={styles.buttonContent}>
                                    <RotateCcw size={17} aria-hidden="true" />
                                    {t("common.clear")}
                                </span>
                            </Button>

                            <Button
                                id="batch-submit"
                                type="submit"
                                variant="primary"
                                size="medium"
                                disabled={isProcessing || isLoadingAccounts}
                                aria-busy={isProcessing}
                            >
                                {isProcessing ? (
                                    t("batch.actions.processing")
                                ) : (
                                    <span className={styles.buttonContent}>
                                        <Upload size={17} aria-hidden="true" />
                                        {t("batch.actions.upload")}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card title={t("batch.format.title")} className={styles.formatCard}>
                    <p>{t("batch.format.description")}</p>

                    <pre tabIndex={0} aria-label={t("batch.format.exampleLabel")} className={styles.formatExample}>{exampleCsv}</pre>

                    {accounts.length > 0 && (
                        <>
                            <p>{t("batch.format.accounts")}</p>
                            <ul className={styles.accountList}>
                                {sortedAccounts.map((account) => (
                                    <li key={account.id}>
                                        <span>{account.name}</span>
                                        <code>{normalizeIban(account.iban)}</code>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    <div className={styles.warning}>
                        <TriangleAlert size={17} aria-hidden="true" />
                        <span>{t("batch.format.warning")}</span>
                    </div>

                    <button
                        type="button"
                        className={styles.exampleLink}
                        onClick={handleDownloadExample}
                    >
                        <Download size={16} aria-hidden="true" />
                        {t("batch.format.download")}
                    </button>
                </Card>
            </div>

            {results && (
                <Card className={styles.resultsCard}>
                    <h2 ref={resultHeadingRef} tabIndex={-1} className={cardStyles.card__title}>
                        {t("batch.result.title")}
                    </h2>

                    <p
                        className={failed > 0 ? styles.resultWarning : styles.resultOk}
                        role="status"
                        aria-live="polite"
                    >
                        {t("batch.result.processed", {
                            succeeded,
                            total: results.length,
                        })}

                        {failed > 0 && (
                            <>
                                {" "}
                                {t("batch.result.failed", { count: failed })}
                            </>
                        )}
                    </p>

                    <div className={styles.tableWrapper} tabIndex={0} role="region" aria-label={t("batch.result.title")}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th scope="col">{t("batch.table.row")}</th>
                                    <th scope="col">{t("batch.table.toIban")}</th>
                                    <th scope="col">{t("batch.table.amount")}</th>
                                    <th scope="col">{t("batch.table.reference")}</th>
                                    <th scope="col">{t("batch.table.status")}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {results.map((row) => (
                                    <tr key={row.rowNumber}>
                                        <td>{row.rowNumber}</td>
                                        <td>{row.toIban || "—"}</td>
                                        <td>
                                            {row.amount > 0
                                                ? row.amount.toLocaleString(locale, {
                                                    minimumFractionDigits: 2,
                                                })
                                                : "—"}
                                        </td>
                                        <td>{row.reference || "—"}</td>

                                        <td>
                                            {row.success ? (
                                                <span className={styles.statusSuccess}>
                                                    <CircleCheck size={16} aria-hidden="true" />
                                                    {t("batch.table.success")}
                                                </span>
                                            ) : (
                                                <span className={styles.statusError}>
                                                    <CircleX size={16} aria-hidden="true" />
                                                    {row.error && t(row.error.key, row.error.values)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
