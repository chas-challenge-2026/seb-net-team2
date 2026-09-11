import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import { useAccounts } from '../../hooks/useAccounts'
import styles from './Batch.module.css'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'

const MAX_FILE_SIZE_BYTES = 1024 * 1024
const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/
const EXPECTED_HEADER = ['from_account_id', 'to_iban', 'amount', 'reference']
const EXAMPLE_CSV = `from_account_id,to_iban,amount,reference
1,SE8550000000054910000003,5000.00,Faktura #2001
1,SE8550000000054910000005,12500.00,Faktura #2002`

type BatchRow = {
    rowNumber: number
    toIban: string
    amount: number
    reference: string
    success: boolean
    error?: string
}

function splitCsvLines(content: string): string[] {
    return content.split(/\r?\n/).filter(line => line.trim().length > 0)
}

function isValidHeader(headerLine: string): boolean {
    const columns = headerLine.split(',').map(column => column.trim().toLowerCase())
    return (
        columns.length === EXPECTED_HEADER.length &&
        columns.every((column, index) => column === EXPECTED_HEADER[index])
    )
}

function parseBatchRows(dataLines: string[], validAccountIds: string[]): BatchRow[] {
    return dataLines.map((line, index) => {
        const rowNumber = index + 2 // +1 for header row, +1 for 1-based numbering
        const parts = line.split(',').map(part => part.trim())

        if (parts.length !== 4) {
            return {
                rowNumber,
                toIban: parts[1] ?? '',
                amount: 0,
                reference: parts[3] ?? '',
                success: false,
                error: `Expected 4 columns, got ${parts.length}. Commas inside a field are not supported.`,
            }
        }

        const [fromAccountId, toIbanRaw, amountRaw, reference] = parts
        const toIban = toIbanRaw.replace(/\s/g, '').toUpperCase()

        if (!validAccountIds.includes(fromAccountId)) {
            return { rowNumber, toIban, amount: 0, reference, success: false, error: `Unknown from_account_id '${fromAccountId}'` }
        }

        if (!IBAN_PATTERN.test(toIban)) {
            return { rowNumber, toIban, amount: 0, reference, success: false, error: `Invalid IBAN '${toIbanRaw}'` }
        }

        const amount = Number(amountRaw)
        if (!Number.isFinite(amount) || amount <= 0) {
            return { rowNumber, toIban, amount: 0, reference, success: false, error: `Invalid amount '${amountRaw}'` }
        }

        return { rowNumber, toIban, amount, reference, success: true }
    })
}

export function Batch() {
    const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts()
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [results, setResults] = useState<BatchRow[] | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function resetFileInput() {
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const selected = event.target.files?.[0] ?? null
        setResults(null)

        if (!selected) {
            setFile(null)
            setFileError(null)
            return
        }

        if (!selected.name.toLowerCase().endsWith('.csv')) {
            resetFileInput()
            setFileError('Only .csv files are supported.')
            return
        }

        if (selected.size > MAX_FILE_SIZE_BYTES) {
            resetFileInput()
            setFileError('The file is larger than 1 MB.')
            return
        }

        setFile(selected)
        setFileError(null)
        // Move focus off the file input so a subsequent Enter submits the form
        // instead of reopening the native file picker.
        document.getElementById('batch-submit')?.focus()
    }

    function handleClear() {
        resetFileInput()
        setFileError(null)
        setResults(null)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!file) {
            setFileError('Choose a CSV file first.')
            return
        }
        if (isLoadingAccounts) {
            setFileError('Account data is still loading — try again in a moment.')
            return
        }

        setIsProcessing(true)
        const content = await file.text()
        const lines = splitCsvLines(content)

        if (lines.length === 0 || !isValidHeader(lines[0])) {
            setFileError(`The CSV header must be exactly: ${EXPECTED_HEADER.join(',')}`)
            setIsProcessing(false)
            resetFileInput()
            return
        }

        const dataLines = lines.slice(1)
        if (dataLines.length === 0) {
            setFileError('The CSV file is empty or has no data rows.')
            setIsProcessing(false)
            resetFileInput()
            return
        }

        const validAccountIds = accounts.map(account => account.id)
        setResults(parseBatchRows(dataLines, validAccountIds))
        setIsProcessing(false)
        resetFileInput()
    }

    function handleDownloadExample() {
        const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'example-batch.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    const succeeded = results?.filter(row => row.success).length ?? 0
    const failed = results ? results.length - succeeded : 0

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>PAYMENTS</span>
                    <h1>Batch upload</h1>
                    <p>Upload multiple payments at once via a CSV file.</p>
                </div>
                <div className={styles.headerBadge}>
                    <span className={styles.statusDot} />
                    Mock mode
                </div>
            </header>

            <div className={styles.layout}>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.sectionHeading}>
                            <h2>CSV file</h2>
                            <p>Choose a file, then upload and process it.</p>
                        </div>

                        <label>
                            CSV file
                            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} />
                        </label>
                        <p className={styles.hint}>Max file size: 1 MB. Encoding: UTF-8.</p>

                        {fileError && (
                            <div className={styles.errorBanner} role="alert">
                                {fileError}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="medium"
                                onClick={handleClear}
                                disabled={!file && !fileError && !results}
                            >
                                Clear
                            </Button>
                            <Button
                                id="batch-submit"
                                type="submit"
                                variant="primary"
                                size="medium"
                                disabled={!file || isProcessing || isLoadingAccounts}
                                aria-busy={isProcessing}
                            >
                                {isProcessing ? 'Processing…' : 'Upload and process'}
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card title="CSV format" className={styles.formatCard}>
                    <p>The file must have the following columns:</p>
                    <pre className={styles.formatExample}>{EXAMPLE_CSV}</pre>
                    <div className={styles.warning}>
                        Note: commas inside a field are not supported. Avoid references that contain commas.
                    </div>
                    <button type="button" className={styles.exampleLink} onClick={handleDownloadExample}>
                        Download example-batch.csv
                    </button>
                </Card>
            </div>

            {results && (
                <Card title="Result" className={styles.resultsCard}>
                    <p
                        className={failed > 0 ? styles.resultWarning : styles.resultOk}
                        role="status"
                        aria-live="polite"
                    >
                        {succeeded} of {results.length} payments processed.
                        {failed > 0 && ` ${failed} row(s) failed — see below.`}
                    </p>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th scope="col">Row</th>
                                    <th scope="col">To IBAN</th>
                                    <th scope="col">Amount</th>
                                    <th scope="col">Reference</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(row => (
                                    <tr key={row.rowNumber}>
                                        <td>{row.rowNumber}</td>
                                        <td>{row.toIban || '—'}</td>
                                        <td>{row.success ? row.amount.toLocaleString('en-SE', { minimumFractionDigits: 2 }) : '—'}</td>
                                        <td>{row.reference || '—'}</td>
                                        <td>
                                            {row.success ? (
                                                <span className={styles.statusSuccess}>✓ Success</span>
                                            ) : (
                                                <span className={styles.statusError}>✕ {row.error}</span>
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
    )
}
