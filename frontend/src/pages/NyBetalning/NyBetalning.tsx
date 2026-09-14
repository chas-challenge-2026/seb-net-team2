import { type FormEvent, useState } from "react"
import { useAccounts } from "../../hooks/useAccounts"
import styles from './NyBetalning.module.css'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import { createPayment } from '../../services/accountService'
import { paymentSchema, type PaymentForm } from "../../schemas/paymentSchema"


const initialForm: PaymentForm = {
    fromAccountId: '1',
    recipient: '',
    iban: '',
    amount: '',
    reference: '',
    message: '',
}


export function NyBetalning() {
        
    const { 
        data: accounts = [],
        isLoading: isLoadingAccounts,
        isError: accountsError, 
    } = useAccounts()
    const [form, setForm] = useState(initialForm)
    const [submitted, setSubmitted] = useState(false)
    const [ isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectedAccount = accounts.find(account => account.id === form.fromAccountId,)

    const amount = Number(form.amount) || 0
    const approvalLevel =
    amount > 500000 ? 'Two approvers are required' :
    amount > 50000 ? 'One approver is required' :
    'Payment will be processed instantly'
    
    function updateField(field: keyof PaymentForm, value: string) {
        setForm(current => ({
            ...current,
            [field]: value,
        }))
        setSubmitted(false)
        setError(null)
    }

    function clearForm() {
        setForm(initialForm)
        setSubmitted(false)
        setError(null)
    }
    
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if(!selectedAccount){
            setError('Select an account.')
            return
        }

        const validation = paymentSchema.safeParse(form)

        if(!validation.success) {
            setError(validation.error.issues[0].message)
            return
        }

        const validatedForm = validation.data

        if(amount > selectedAccount.balance) {
            setError('The payment amount exceeds the account balance.')
            return
        }

        setError(null)
        setSubmitted(false)
        setIsSubmitting(true)

        try {
            await createPayment({
                fromAccountId: Number(validatedForm.fromAccountId),
                toIban: validatedForm.iban,
                amount: Number(validatedForm.amount),
                currency: 'SEK',
                reference: validatedForm.reference,
            })

            setSubmitted(true)
            setForm(initialForm)
        } catch {
            setError('Could not create the payment. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return(
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>PAYMENTS</span>
                    <h1>Create a new payment</h1>
                    <p>Send a secure payment from your company account.</p>
                </div>
                <div className={styles.headerBadge}>
                    <span className={styles.statusDot} />
                    Mock mode
                </div>
            </header>

            <div className={styles.layout}>
                <Card><form onSubmit={handleSubmit}>
                    <div className={styles.sectionHeading}>
                        <div className={styles.number}>01</div>
                        <div>
                            <h2>Payment details</h2>
                            <p>Enter the recipient and payment amount.</p>
                        </div>
                    </div>

                    <label>
                        From account
                        <select
                        value={form.fromAccountId}
                        disabled={isLoadingAccounts || accountsError || isSubmitting}
                        onChange={event => updateField('fromAccountId', event.target.value)}
                        >
                            {isLoadingAccounts && <option>Loading accounts...</option>}
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} · {account.balance.toLocaleString('en-SE')} {account.currency}
                                </option>
                            ))}
                        </select>
                        {accountsError && (
                            <p className={styles.fieldError}>Could not load accounts.</p>
                        )}
                    </label>
                    
                    <label>
                        Recipient
                        <input
                            required
                            value={form.recipient}
                            placeholder="Company or person"
                            onChange={event => updateField('recipient', event.target.value)}
                        />
                    </label>

                    <label>
                        IBAN
                        <input
                        required
                        value={form.iban}
                        placeholder="SE00 0000 0000 0000 0000 0000"
                        onChange={event => updateField('iban', event.target.value)}
                        />
                    </label>
                    <div className={styles.fieldGrid}>
                        <label>
                            Amount
                            <div className={styles.amountInput}>
                                <input
                                required
                                min='1'
                                step="0.01"
                                type="number"
                                value={form.amount}
                                placeholder="0.00"
                                onChange={event => updateField('amount', event.target.value)}
                                />
                                <span>SEK</span>
                            </div>
                        </label>
                        <label>
                            Reference
                            <input 
                            value={form.reference}
                            placeholder="Invoice or OCR"
                            onChange={event => updateField('reference', event.target.value)}
                            />
                        </label>
                    </div>

                    <label>
                        Message <span className={styles.optional}>Optional</span>
                        <textarea
                        rows={3}
                        value={form.message}
                        placeholder="Write a message to the recipient"
                        onChange={event => updateField('message', event.target.value)}
                        />
                    </label>

                    {submitted && (
                        <div className={styles.success}>
                            The payment has been created and is awaiting processing.
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <Button
                        type="button"
                        variant="ghost"
                        size="medium"
                        onClick={clearForm}
                        >
                            Clear form
                        </Button>
                        <Button type="submit" variant="primary" size="medium" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating payment...' : 'Review payment'}
                            <span aria-hidden="true">→</span>
                        </Button>
                    </div>
                    </form>
                </Card>
                <Card title="Summary" 
                variant="primary"
                className={styles.summary}>
                    <div className={styles.summaryAmount}>
                        <span>Amount to pay</span>
                        <strong>
                            {amount.toLocaleString('en-SE', {
                                minimumFractionDigits: 2,
                            })}{' '}
                            SEK
                        </strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Recipient</span>
                        <strong>{form.recipient || 'Not specified'}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Recipient IBAN</span>
                        <strong>{form.iban || 'Not specified'}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Reference</span>
                        <strong>{form.reference || 'Not specified'}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>From account</span>
                        <strong>{selectedAccount?.name ?? 'Select an account'}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>Balance after payment</span>
                        <strong>
                            {selectedAccount ? (selectedAccount.balance - amount).toLocaleString('en-SE')
                            : '0'}{' '}
                            SEK
                        </strong>
                    </div>

                    <div className={styles.approval}>
                        <span className={styles.approvalIcon}>✓</span>
                        <div>
                            <strong>{approvalLevel}</strong>
                            <p>Approval rules are based on the payment amount.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

