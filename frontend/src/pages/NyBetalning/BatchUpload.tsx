import { RequiredMark } from "../../components/FormValidation/RequiredField";
import { focusField } from "../../components/FormValidation/useFormValidation";
import { type ChangeEvent, type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslatedError } from "../../components/FormValidation/useFormValidation";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import {
    ArrowLeft,
    ArrowRight,
    CircleCheck,
    CircleX,
    ClipboardCheck,
    Clock,
    Download,
    FileSpreadsheet,
    RotateCcw,
    TriangleAlert,
} from "lucide-react";

import { useAccounts } from "../../hooks/useAccounts";
import { uploadPaymentBatch } from "../../services/accountService";
import { isValidIban } from "../../schemas/paymentSchema";
import Card from "../../components/Card/Card";
import cardStyles from "../../components/Card/Card.module.css";
import Button from "../../components/Button/Button";

import paymentStyles from "./NyBetalning.module.css";
import styles from "./BatchUpload.module.css";

const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const EXPECTED_HEADER = ["from_account_id", "to_iban", "amount", "reference"];
const MAX_REFERENCE_LENGTH = 100;
const MAX_ACCOUNT_ID = 2_147_483_647;

const EXAMPLE_CSV = `from_account_id,to_iban,amount,reference
1,SE3550000000054910000003,5000.00,Faktura #2001
1,SE7850000000054910000005,12500.00,"Malmö Bygg, faktura #2002"`;

// The server answers this when from_account_id is not one of the company's accounts.
const UNKNOWN_ACCOUNT_PATTERN = /^Row (\d+), Account (\d+) does NOT exist$/;

type RowStatus = "created" | "notCreated" | "invalid";

type BatchRow = {
    rowNumber: number;
    accountId: string;
    toIban: string;
    amount: number;
    reference: string;
    status: RowStatus;
    // The payment's status from the server, e.g. "completed" or "pending_approval".
    paymentStatus?: string;
    // The account's public id from the server, which /api/Accounts can turn into a name.
    fromAccountPublicId?: string;
    error?: TranslatedError;
};

// Why the rows are shown on the file step: some rows are wrong, or the server refused the batch.
type BatchProblem =
    | { kind: "invalid" }
    | { kind: "rejected"; reason?: string };

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

function rowError(rowNumber: number, parts: string[], error: TranslatedError): BatchRow {
    return {
        rowNumber,
        accountId: parts[0] ?? "",
        toIban: parts[1] ?? "",
        amount: 0,
        reference: parts[3] ?? "",
        status: "invalid",
        error,
    };
}

function parseBatchRows(dataLines: string[]): BatchRow[] {
    return dataLines.map((line, index): BatchRow => {
        const rowNumber = index + 2;
        const parts = splitCsvLine(line);

        if (parts.length !== 4) {
            return rowError(rowNumber, parts, { key: "batch.errors.columns", values: { count: parts.length } });
        }

        const [accountId, toIbanRaw, amountRaw, reference] = parts;
        const toIban = toIbanRaw.replace(/\s/g, "").toUpperCase();
        const cleaned = [accountId, toIban, amountRaw, reference];

        if (!/^\d+$/.test(accountId) || Number(accountId) < 1 || Number(accountId) > MAX_ACCOUNT_ID) {
            return rowError(rowNumber, cleaned, { key: "batch.errors.invalidAccount", values: { id: accountId } });
        }

        if (!isValidIban(toIban)) {
            return rowError(rowNumber, cleaned, { key: "batch.errors.invalidIban", values: { iban: toIbanRaw } });
        }

        // The server only reads plain decimal numbers, so "1e3" or "1 000" are rejected here.
        const amount = Number(amountRaw);

        if (!/^\d+(\.\d{1,2})?$/.test(amountRaw) || amount <= 0) {
            return rowError(rowNumber, cleaned, { key: "batch.errors.invalidAmount", values: { amount: amountRaw } });
        }

        if (reference.length > MAX_REFERENCE_LENGTH) {
            return rowError(rowNumber, cleaned, { key: "payment.errors.referenceTooLong" });
        }

        // The server stores a reference made only of digits as a number and loses the text.
        if (/^\d+(\.\d+)?$/.test(reference)) {
            return rowError(rowNumber, cleaned, { key: "batch.errors.numericReference" });
        }

        return { rowNumber, accountId, toIban, amount, reference, status: "notCreated" };
    });
}

function quoteCsvField(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
}

// Rebuilds the file from the checked rows. Amounts always get two decimals, since the server reads "5000" wrongly.
function toBatchCsv(rows: BatchRow[]): string {
    return [
        EXPECTED_HEADER.join(","),
        ...rows.map((row) =>
            [row.accountId, row.toIban, row.amount.toFixed(2), quoteCsvField(row.reference)].join(",")
        ),
    ].join("\n");
}

function totalAmount(rows: BatchRow[]): number {
    return rows.reduce((sum, row) => sum + row.amount, 0);
}

const UPLOAD_HISTORY_KEY = "batchUploadHistory";
const UPLOAD_HISTORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

type UploadRecord = { hash: string; createdAt: number };

// FNV-1a. Only used to recognise the same file again, not for security.
function hashContent(content: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < content.length; i++) {
        hash ^= content.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
}

// Storage can be missing or blocked (private mode), so the warning is a convenience and never stops an upload.
function readUploadHistory(): UploadRecord[] {
    try {
        const records = JSON.parse(localStorage.getItem(UPLOAD_HISTORY_KEY) ?? "[]") as UploadRecord[];
        return records.filter((record) => Date.now() - record.createdAt < UPLOAD_HISTORY_LIFETIME_MS);
    } catch {
        return [];
    }
}

function rememberUpload(hash: string) {
    try {
        const records = [...readUploadHistory().filter((record) => record.hash !== hash), { hash, createdAt: Date.now() }];
        localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(records.slice(-20)));
    } catch {
        // Nothing to do; the next upload just won't be warned about.
    }
}

export function BatchUpload() {
    const { t, i18n } = useTranslation();
    const { data: accounts = [] } = useAccounts();

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [generalError, setGeneralError] = useState<TranslatedError | null>(null);
    const [fileError, setFileError] = useState<TranslatedError | null>(null);
    const [problemRows, setProblemRows] = useState<BatchRow[] | null>(null);
    const [problem, setProblem] = useState<BatchProblem | null>(null);
    const [reviewRows, setReviewRows] = useState<BatchRow[] | null>(null);
    const [createdRows, setCreatedRows] = useState<BatchRow[] | null>(null);
    // When the same rows were already created recently, so the user can stop a double payment.
    const [previousUploadAt, setPreviousUploadAt] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const problemHeadingRef = useRef<HTMLHeadingElement>(null);
    const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
    const resultHeadingRef = useRef<HTMLHeadingElement>(null);
    // The batch endpoint has no idempotency key, so a second click before the button disables would create every payment twice.
    const isCreatingRef = useRef(false);
    const focusProblemRef = useRef(false);
    const focusSubmitRef = useRef(false);
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const currentStep = createdRows ? 2 : reviewRows ? 1 : 0;
    const batchSteps = [
        t("batch.steps.file"),
        t("payment.steps.review"),
        t("payment.steps.result"),
    ];

    // Each step replaces the previous one, so focus moves to its heading or it is lost.
    useEffect(() => {
        if (currentStep === 1) reviewHeadingRef.current?.focus();
        if (currentStep === 2) resultHeadingRef.current?.focus();
        if (currentStep === 0 && focusSubmitRef.current) {
            focusSubmitRef.current = false;
            document.getElementById("batch-submit")?.focus();
        }
    }, [currentStep]);

    useEffect(() => {
        if (problemRows && focusProblemRef.current) {
            focusProblemRef.current = false;
            problemHeadingRef.current?.focus();
        }
    }, [problemRows]);

    const csvFileSchema = z.object({
        name: z.string().refine(
            (name) => name.toLowerCase().endsWith(".csv"),
            { message: "batch.errors.csvOnly" }
        ),
        size: z.number().max(MAX_FILE_SIZE_BYTES, "batch.errors.fileTooLarge"),
    });

    function formatAmount(amount: number): string {
        return amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function reportFileError(message: TranslatedError) {
        setFileError(message);
        requestAnimationFrame(() => focusField("batch-file"));
    }

    function resetFileInput() {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function clearProblem() {
        setProblemRows(null);
        setProblem(null);
    }

    function selectFile(selected: File | null) {
        clearProblem();
        setGeneralError(null);

        if (!selected) {
            setFile(null);
            setFileError(null);
            return;
        }

        setFile(selected);
        const result = csvFileSchema.safeParse(selected);

        if (!result.success) {
            reportFileError({ key: result.error.issues[0].message });
            return;
        }

        setFileError(null);
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        selectFile(event.target.files?.[0] ?? null);
    }

    function handleDragOver(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        if (!isProcessing) setIsDragging(true);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        if (isProcessing) return;

        if (fileInputRef.current) fileInputRef.current.value = "";
        selectFile(event.dataTransfer.files[0] ?? null);
    }

    function handleClear() {
        resetFileInput();
        setFileError(null);
        setGeneralError(null);
        clearProblem();
    }

    function showProblem(rows: BatchRow[], nextProblem: BatchProblem) {
        focusProblemRef.current = true;
        setProblem(nextProblem);
        setProblemRows(rows);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!file) {
            reportFileError({ key: "batch.errors.chooseFile" });
            return;
        }

        const fileValidation = csvFileSchema.safeParse(file);
        if (!fileValidation.success) {
            reportFileError({ key: fileValidation.error.issues[0].message });
            return;
        }
        setFileError(null);
        setGeneralError(null);
        clearProblem();
        setIsProcessing(true);

        try {
            const lines = splitCsvLines(await file.text());

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

            const rows = parseBatchRows(dataLines);

            // Nothing goes to review while any row is wrong, so the batch is never split.
            if (rows.some((row) => row.status === "invalid")) {
                setProblem({ kind: "invalid" });
                setProblemRows(rows);
                reportFileError({ key: "validation.batchRows" });
                return;
            }

            const hash = hashContent(toBatchCsv(rows));
            setPreviousUploadAt(readUploadHistory().find((record) => record.hash === hash)?.createdAt ?? null);
            setReviewRows(rows);
        } catch {
            setGeneralError({ key: "validation.fileRead" });
        } finally {
            setIsProcessing(false);
        }
    }

    function handleBack() {
        focusSubmitRef.current = true;
        setReviewRows(null);
    }

    async function handleCreate() {
        if (!reviewRows || !file || isCreatingRef.current) return;

        isCreatingRef.current = true;
        setIsProcessing(true);

        try {
            const csv = toBatchCsv(reviewRows);
            // The server returns the payments in the same order as the rows.
            const created = await uploadPaymentBatch(csv, file.name);
            rememberUpload(hashContent(csv));
            setCreatedRows(
                reviewRows.map((row, index) => ({
                    ...row,
                    status: "created",
                    paymentStatus: created[index]?.status,
                    fromAccountPublicId: created[index]?.fromAccountId,
                }))
            );
            setReviewRows(null);
            resetFileInput();
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            const unknownAccount = UNKNOWN_ACCOUNT_PATTERN.exec(message);
            const rows = reviewRows;
            setReviewRows(null);

            if (unknownAccount) {
                // The server counts data rows from 1; the table counts the header as row 1.
                const rowNumber = Number(unknownAccount[1]) + 1;
                showProblem(
                    rows.map((row) =>
                        row.rowNumber === rowNumber
                            ? {
                                ...row,
                                status: "invalid",
                                error: { key: "batch.errors.unknownAccount", values: { id: unknownAccount[2] } },
                            }
                            : row
                    ),
                    { kind: "rejected" }
                );
            } else {
                showProblem(rows, { kind: "rejected", reason: message });
            }
        } finally {
            isCreatingRef.current = false;
            setIsProcessing(false);
        }
    }

    function handleNewFile() {
        setCreatedRows(null);
        handleClear();
    }

    function handleDownloadExample() {
        const blob = new Blob([EXAMPLE_CSV], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "example-batch.csv";
        link.click();

        URL.revokeObjectURL(url);
    }

    function problemText(): string {
        if (!problem || !problemRows) return "";

        if (problem.kind === "invalid") {
            return t("batch.result.invalid", { count: problemRows.filter((row) => row.status === "invalid").length });
        }

        return problem.reason
            ? t("batch.result.rejected", { reason: problem.reason })
            : t("batch.result.rejectedRow");
    }

    function renderStatus(row: BatchRow) {
        if (row.status === "invalid") {
            return (
                <span className={styles.statusError}>
                    <CircleX size={16} aria-hidden="true" />
                    {row.error && t(row.error.key, row.error.values)}
                </span>
            );
        }

        if (row.status === "notCreated") return t("batch.table.notCreated");

        if (row.paymentStatus === "pending_approval") {
            return (
                <span className={styles.statusPending}>
                    <Clock size={16} aria-hidden="true" />
                    {t("payment.result.statusValues.pendingApproval")}
                </span>
            );
        }

        return (
            <span className={styles.statusSuccess}>
                <CircleCheck size={16} aria-hidden="true" />
                {row.paymentStatus === "completed"
                    ? t("payment.result.statusValues.completed")
                    : t("batch.table.created")}
            </span>
        );
    }

    // The file only holds the internal account number; the name is known once the server returns the account's id.
    function accountLabel(row: BatchRow): string {
        const account = accounts.find((candidate) => candidate.id === row.fromAccountPublicId);
        return account?.name ?? t("batch.table.accountNumber", { id: row.accountId });
    }

    function renderTable(rows: BatchRow[], label: string, columns: { account?: boolean; status?: boolean }) {
        return (
            <div className={styles.tableWrapper} tabIndex={0} role="region" aria-label={label}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">{t("batch.table.row")}</th>
                            {columns.account && <th scope="col">{t("batch.table.fromAccount")}</th>}
                            <th scope="col">{t("batch.table.toIban")}</th>
                            <th scope="col" className={styles.amountCell}>{t("batch.table.amount")}</th>
                            <th scope="col">{t("batch.table.reference")}</th>
                            {columns.status && <th scope="col">{t("batch.table.status")}</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.rowNumber}>
                                <td>{row.rowNumber}</td>
                                {columns.account && <td>{accountLabel(row)}</td>}
                                <td>{row.toIban || "—"}</td>
                                <td className={styles.amountCell}>{row.amount > 0 ? formatAmount(row.amount) : "—"}</td>
                                <td>{row.reference || "—"}</td>
                                {columns.status && <td>{renderStatus(row)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const pendingCount = createdRows?.filter((row) => row.paymentStatus === "pending_approval").length ?? 0;
    const completedCount = (createdRows?.length ?? 0) - pendingCount;

    return (
        <div className={styles.batch}>

            <ol className={paymentStyles.steps} aria-label={t("payment.steps.label")}>
                {batchSteps.map((step, index) => (
                    <li
                        key={step}
                        className={`${paymentStyles.step} ${index < currentStep ? paymentStyles.stepComplete : ""} ${index === currentStep ? paymentStyles.stepCurrent : ""}`}
                        aria-current={index === currentStep ? "step" : undefined}
                    >
                        <span className={paymentStyles.stepNumber} aria-hidden="true">
                            {index < currentStep ? "✓" : index + 1}
                        </span>
                        <span>{step}</span>
                    </li>
                ))}
            </ol>

            {currentStep === 0 && (
                <>
                    <div className={paymentStyles.layout}>
                        <Card className={paymentStyles.formCard}>
                            <form onSubmit={handleSubmit} noValidate>
                                <div className={paymentStyles.sectionHeading}>
                                    <div className={paymentStyles.number}>01</div>

                                    <div>
                                        <h2>{t("batch.file.title")}</h2>
                                        <p>{t("batch.description")}</p>
                                    </div>
                                </div>

                                <span id="batch-file-label" className={styles.fieldLabel}>
                                    {t("batch.file.label")}
                                    <RequiredMark />
                                </span>

                                <div
                                    className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""} ${fileError ? styles.dropzoneError : ""}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                >
                                    <label htmlFor="batch-file" className={styles.dropzoneLabel}>
                                        <input
                                            id="batch-file"
                                            className="visually-hidden"
                                            aria-labelledby="batch-file-label"
                                            aria-invalid={Boolean(fileError)}
                                            aria-describedby={[
                                                file ? "batch-file-name" : undefined,
                                                "batch-file-hint",
                                                fileError ? "batch-file-error" : undefined,
                                            ].filter(Boolean).join(" ")}
                                            disabled={isProcessing}
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            required
                                        />
                                        <FileSpreadsheet className={styles.dropzoneIcon} size={26} strokeWidth={1.75} aria-hidden="true" />
                                        {file ? (
                                            <span id="batch-file-name" className={styles.fileName}>
                                                {t("batch.file.selected", { name: file.name })}
                                            </span>
                                        ) : (
                                            <span className={styles.dropHint}>{t("batch.file.dropHint")}</span>
                                        )}
                                        <span className={styles.chooseButton} aria-hidden="true">
                                            {t(file ? "batch.file.change" : "batch.file.choose")}
                                        </span>
                                    </label>

                                    {/* Outside the label, so downloading the example does not also open the file picker. */}
                                    <p className={styles.exampleHint}>
                                        {t("batch.file.noFile")}{" "}
                                        <button
                                            type="button"
                                            className={styles.exampleLink}
                                            onClick={handleDownloadExample}
                                        >
                                            <Download size={15} aria-hidden="true" />
                                            {t("batch.format.download")}
                                        </button>
                                    </p>
                                </div>

                                <p id="batch-file-hint" className={styles.hint}>{t("batch.file.hint")}</p>

                                {fileError && (
                                    <div id="batch-file-error" className={styles.errorBanner} role="alert">
                                        <TriangleAlert size={18} aria-hidden="true" />
                                        <span>{t(fileError.key, fileError.values)}</span>
                                    </div>
                                )}

                                {generalError && <div className={styles.errorBanner} role="alert">{t(generalError.key, generalError.values)}</div>}

                                <section className={styles.format} aria-labelledby="batch-format-title">
                                    <h3 id="batch-format-title">{t("batch.format.title")}</h3>
                                    <p>{t("batch.format.description")}</p>

                                    <dl className={styles.columnList}>
                                        <div>
                                            <dt><code>from_account_id</code></dt>
                                            <dd>{t("batch.format.columnHelp.account")}</dd>
                                        </div>
                                        <div>
                                            <dt><code>to_iban</code></dt>
                                            <dd>{t("batch.format.columnHelp.iban")}</dd>
                                        </div>
                                        <div>
                                            <dt><code>amount</code></dt>
                                            <dd>{t("batch.format.columnHelp.amount")}</dd>
                                        </div>
                                        <div>
                                            <dt><code>reference</code></dt>
                                            <dd>{t("batch.format.columnHelp.reference")}</dd>
                                        </div>
                                    </dl>
                                </section>

                                <div className={styles.warning}>
                                    <TriangleAlert size={17} aria-hidden="true" />
                                    <span>{t("batch.format.warning")}</span>
                                </div>

                                <div className={styles.actions}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="medium"
                                        onClick={handleClear}
                                        disabled={!file && !fileError && !problemRows}
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
                                        disabled={isProcessing}
                                        aria-busy={isProcessing}
                                    >
                                        {isProcessing ? (
                                            t("batch.actions.processing")
                                        ) : (
                                            <span className={styles.buttonContent}>
                                                {t("batch.actions.review")}
                                                <ArrowRight size={17} aria-hidden="true" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {problemRows && (
                        <Card className={styles.resultsCard}>
                            <h2 ref={problemHeadingRef} tabIndex={-1} className={cardStyles.card__title}>
                                {t("batch.result.title")}
                            </h2>

                            <p className={styles.resultWarning} role="status" aria-live="polite">
                                {problemText()}
                            </p>

                            {renderTable(problemRows, t("batch.result.title"), { status: true })}
                        </Card>
                    )}
                </>
            )}

            {currentStep === 1 && reviewRows && (
                <Card className={styles.stepCard}>
                    <p className={paymentStyles.eyebrow}>{t("payment.review.eyebrow")}</p>
                    <div className={styles.stepTitle}>
                        <ClipboardCheck size={22} strokeWidth={2} aria-hidden="true" />
                        <h2 ref={reviewHeadingRef} tabIndex={-1}>{t("batch.review.title")}</h2>
                    </div>
                    <p className={styles.stepIntro}>
                        {t("batch.review.summary", { count: reviewRows.length, file: file?.name ?? "" })}
                    </p>

                    {previousUploadAt && (
                        <div className={styles.duplicateWarning}>
                            <TriangleAlert size={18} aria-hidden="true" />
                            <div>
                                <strong>{t("batch.review.duplicateTitle")}</strong>
                                <span>
                                    {t("batch.review.duplicateText", {
                                        time: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })
                                            .format(new Date(previousUploadAt)),
                                    })}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className={paymentStyles.resultAmount}>
                        <span>{t("batch.review.total")}</span>
                        <strong>{formatAmount(totalAmount(reviewRows))} SEK</strong>
                    </div>

                    {renderTable(reviewRows, t("batch.review.title"), { account: true })}

                    <div className={styles.warning}>
                        <TriangleAlert size={17} aria-hidden="true" />
                        <span>{t("batch.format.warning")}</span>
                    </div>

                    <div className={styles.actions}>
                        <Button type="button" variant="ghost" size="medium" onClick={handleBack} disabled={isProcessing}>
                            <span className={styles.buttonContent}>
                                <ArrowLeft size={17} aria-hidden="true" />
                                {t("payment.actions.goBack")}
                            </span>
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            size="medium"
                            onClick={handleCreate}
                            disabled={isProcessing}
                            aria-busy={isProcessing}
                        >
                            {isProcessing ? (
                                t("payment.actions.creating")
                            ) : (
                                <span className={styles.buttonContent}>
                                    <CircleCheck size={17} aria-hidden="true" />
                                    {t("batch.actions.create", { count: reviewRows.length })}
                                </span>
                            )}
                        </Button>
                    </div>
                </Card>
            )}

            {currentStep === 2 && createdRows && (
                <Card className={styles.stepCard}>
                    <span className={paymentStyles.eyebrow}>{t("payment.result.eyebrow")}</span>
                    <div className={`${paymentStyles.resultBanner} ${pendingCount > 0 ? paymentStyles.resultPending : paymentStyles.resultCompleted}`}>
                        <span className={paymentStyles.resultIcon} aria-hidden="true">
                            {pendingCount > 0 ? <Clock size={24} /> : <CircleCheck size={24} />}
                        </span>
                        <div>
                            <h2 ref={resultHeadingRef} tabIndex={-1}>
                                {t("batch.result.createdTitle", { count: createdRows.length })}
                            </h2>
                            <p role="status" aria-live="polite">
                                {t("batch.result.breakdown", { completed: completedCount, pending: pendingCount })}
                            </p>
                        </div>
                    </div>

                    <div className={paymentStyles.resultAmount}>
                        <span>{t("batch.review.total")}</span>
                        <strong>{formatAmount(totalAmount(createdRows))} SEK</strong>
                    </div>

                    {renderTable(createdRows, t("batch.result.title"), { account: true, status: true })}

                    <div className={styles.actions}>
                        <Link to="/dashboard" className={styles.overviewLink}>
                            {t("batch.actions.viewOverview")}
                        </Link>

                        <Button type="button" variant="primary" size="medium" onClick={handleNewFile}>
                            <span className={styles.buttonContent}>
                                <RotateCcw size={17} aria-hidden="true" />
                                {t("batch.actions.newFile")}
                            </span>
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
