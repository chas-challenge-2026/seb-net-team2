import { focusField } from "../../components/FormValidation/useFormValidation";
import validationStyles from "../../components/FormValidation/FormValidation.module.css";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";

import styles from "./Batch.module.css";

const MAX_FILE_SIZE_BYTES = 1024 * 1024;
const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const EXPECTED_HEADER = ["from_account_id", "to_iban", "amount", "reference"];

const EXAMPLE_CSV = `from_account_id,to_iban,amount,reference
1,SE8550000000054910000003,5000.00,Faktura #2001
1,SE8550000000054910000005,12500.00,Faktura #2002`;

type BatchRow = {
    rowNumber: number;
    toIban: string;
    amount: number;
    reference: string;
    success: boolean;
    error?: string;
};

function splitCsvLines(content: string): string[] {
    return content.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

function isValidHeader(headerLine: string): boolean {
    const columns = headerLine.split(",").map((column) => column.trim().toLowerCase());

    return (
        columns.length === EXPECTED_HEADER.length &&
        columns.every((column, index) => column === EXPECTED_HEADER[index])
    );
}

function parseBatchRows(dataLines: string[], validAccountIds: string[], t: TFunction): BatchRow[] {
    return dataLines.map((line, index) => {
        const rowNumber = index + 2;
        const parts = line.split(",").map((part) => part.trim());

        if (parts.length !== 4) {
            return {
                rowNumber,
                toIban: parts[1] ?? "",
                amount: 0,
                reference: parts[3] ?? "",
                success: false,
                error: t("batch.errors.columns", { count: parts.length }),
            };
        }

        const [fromAccountId, toIbanRaw, amountRaw, reference] = parts;
        const toIban = toIbanRaw.replace(/\s/g, "").toUpperCase();

        if (!validAccountIds.includes(fromAccountId)) {
            return {
                rowNumber,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: t("batch.errors.unknownAccount", { id: fromAccountId }),
            };
        }

        if (!IBAN_PATTERN.test(toIban)) {
            return {
                rowNumber,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: t("batch.errors.invalidIban", { iban: toIbanRaw }),
            };
        }

        const amount = Number(amountRaw);

        if (!Number.isFinite(amount) || amount <= 0) {
            return {
                rowNumber,
                toIban,
                amount: 0,
                reference,
                success: false,
                error: t("batch.errors.invalidAmount", { amount: amountRaw }),
            };
        }

        return { rowNumber, toIban, amount, reference, success: true };
    });
}

export function Batch() {
    const { t, i18n } = useTranslation();
    const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();

    const [file, setFile] = useState<File | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [results, setResults] = useState<BatchRow[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    const csvFileSchema = z.object({
        name: z.string().refine(
            (name) => name.toLowerCase().endsWith(".csv"),
            { message: t("batch.errors.csvOnly") }
        ),
        size: z.number().max(MAX_FILE_SIZE_BYTES, t("batch.errors.fileTooLarge")),
    });

    function reportFileError(message: string) {
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
            reportFileError(result.error.issues[0].message);
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
            reportFileError(t("batch.errors.chooseFile"));
            return;
        }

        if (isLoadingAccounts) {
            setGeneralError(t("batch.errors.accountsLoading"));
            return;
        }

        const fileValidation = csvFileSchema.safeParse(file);
        if (!fileValidation.success) {
            reportFileError(fileValidation.error.issues[0].message);
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
                    t("batch.errors.header", {
                        header: EXPECTED_HEADER.join(","),
                    })
                );

                return;
            }

            const dataLines = lines.slice(1);

            if (dataLines.length === 0) {
                reportFileError(t("batch.errors.empty"));
                return;
            }

            const validAccountIds = accounts.map((account) => account.id);

            const rows = parseBatchRows(dataLines, validAccountIds, t);
            setResults(rows);
            if (rows.some(row => !row.success)) {
                reportFileError(t("validation.batchRows"));
            } else {
                resetFileInput();
            }
        } catch {
            setGeneralError(t("validation.fileRead"));
        } finally {
            setIsProcessing(false);
        }
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

                <div className={styles.headerBadge}>
                    <span className={styles.statusDot} />
                    {t("batch.mockMode")}
                </div>
            </header>

            <div className={styles.layout}>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.sectionHeading}>
                            <h2>{t("batch.file.title")}</h2>
                            <p>{t("batch.file.description")}</p>
                        </div>

                        <label>
                            {t("batch.file.label")}
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
                            />
                        </label>

                        <p id="batch-file-hint" className={styles.hint}>{t("batch.file.hint")}</p>

                        {fileError && (
                            <div id="batch-file-error" className={styles.errorBanner} role="alert">
                                <TriangleAlert size={18} aria-hidden="true" />
                                <span>{fileError}</span>
                            </div>
                        )}

                        {generalError && <div className={styles.errorBanner} role="alert">{generalError}</div>}

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

                    <pre className={styles.formatExample}>{EXAMPLE_CSV}</pre>

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
                <Card title={t("batch.result.title")} className={styles.resultsCard}>
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

                    <div className={styles.tableWrapper}>
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
                                            {row.success
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
                                                    {row.error}
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
