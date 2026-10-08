import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    ArrowRight,
    CircleCheck,
    Clock3,
    ClipboardCheck,
    CreditCard,
    RotateCcw,
    TriangleAlert,
} from "lucide-react";

import { useAccounts } from "../../hooks/useAccounts";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { createPayment } from "../../services/accountService";
import { isValidIban, paymentSchema, type CreatedPayment, type PaymentForm } from "../../schemas/paymentSchema";

import styles from "./NyBetalning.module.css";

const initialForm: PaymentForm = {
    fromAccountId: "",
    recipient: "",
    iban: "",
    amount: "",
    reference: "",
    message: "",
};

export function NyBetalning() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { data: accounts = [], isLoading: isLoadingAccounts, isError: accountsError } = useAccounts();

    const [form, setForm] = useState(initialForm);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PaymentForm, string>>>({});
    const [createdPayment, setCreatedPayment] = useState<CreatedPayment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

    const selectedAccount = accounts.find((account) => account.id === form.fromAccountId) ?? accounts[0];
    const amount = Number(form.amount) || 0;
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";
    const hasIbanInput = form.iban.trim().length > 0;
    const ibanIsValid = hasIbanInput && isValidIban(form.iban);
    const describedBy = (...ids: Array<string | undefined | false>) =>
        ids.filter(Boolean).join(" ") || undefined;
    const currentStep = createdPayment ? 2 : isReviewOpen ? 1 : 0;
    const paymentSteps = [
        t("payment.steps.details"),
        t("payment.steps.review"),
        t("payment.steps.result"),
    ];

    const resultStatus = createdPayment?.status.toLowerCase().replaceAll("-", "_");
    const resultTitle = resultStatus === "completed"
        ? t("payment.result.completedTitle")
        : resultStatus === "pending_approval"
            ? t("payment.result.pendingTitle")
            : resultStatus === "rejected"
                ? t("payment.result.rejectedTitle")
                : t("payment.result.title");
    const resultMessage = resultStatus === "completed"
        ? t("payment.result.completed")
        : resultStatus === "pending_approval"
            ? t("payment.result.pendingApproval")
            : resultStatus === "rejected"
                ? t("payment.result.rejected")
                : t("payment.result.accepted");
    const resultAccountName = createdPayment
        ? accounts.find((account) => Number(account.id) === createdPayment.fromAccountId)?.name
        : undefined;
    const createdAtLabel = createdPayment
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })
            .format(new Date(createdPayment.createdAt))
        : undefined;

    function updateField(field: keyof PaymentForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
        });
        setError(null);
        setIdempotencyKey(null);
    }

    function clearForm() {
        setForm(initialForm);
        setFieldErrors({});
        setError(null);
        setIdempotencyKey(null);
    }

    function startNewPayment() {
        setCreatedPayment(null);
        clearForm();
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedAccount) {
            setFieldErrors({ fromAccountId: t("payment.errors.selectAccount") });
            return;
        }

        const validation = paymentSchema.safeParse({
            ...form,
            fromAccountId: selectedAccount.id,
        });

        if (!validation.success) {
            const nextErrors: Partial<Record<keyof PaymentForm, string>> = {};
            for (const issue of validation.error.issues) {
                const field = issue.path[0] as keyof PaymentForm | undefined;
                if (field && !nextErrors[field]) nextErrors[field] = t(issue.message);
            }
            setFieldErrors(nextErrors);
            setError(null);
            return;
        }

        if (amount > selectedAccount.balance) {
            setFieldErrors({ amount: t("payment.errors.insufficientBalance") });
            return;
        }

        setFieldErrors({});
        setError(null);
        setIsReviewOpen(true);
    }

    async function confirmPayment() {
        const validation = paymentSchema.safeParse({
            ...form,
            fromAccountId: selectedAccount?.id ?? form.fromAccountId,
        });

        if (!validation.success || !selectedAccount) {
            setIsReviewOpen(false);
            if (!validation.success) {
                const nextErrors: Partial<Record<keyof PaymentForm, string>> = {};
                for (const issue of validation.error.issues) {
                    const field = issue.path[0] as keyof PaymentForm | undefined;
                    if (field && !nextErrors[field]) nextErrors[field] = t(issue.message);
                }
                setFieldErrors(nextErrors);
            } else {
                setError(t("payment.errors.selectAccount"));
            }
            return;
        }

        const validatedForm = validation.data;
        const paymentIdempotencyKey = idempotencyKey ?? crypto.randomUUID();

        if (!idempotencyKey) {
            setIdempotencyKey(paymentIdempotencyKey);
        }

        setIsSubmitting(true);

        try {
            const payment = await createPayment(
                {
                    tenantId: user?.tenantId ?? 0,
                    fromAccountId: Number(selectedAccount.id),
                    toIban: validatedForm.iban,
                    amount: Number(validatedForm.amount),
                    currency: "SEK",
                    reference: validatedForm.reference,
                },
                paymentIdempotencyKey
            );

            setCreatedPayment(payment);
            setIsReviewOpen(false);
            setForm(initialForm);
            setIdempotencyKey(null);
        } catch {
            setIsReviewOpen(false);
            setError(t("payment.errors.createFailed"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>{t("payment.eyebrow")}</span>
                    <div className={styles.titleRow}>
                        <CreditCard size={28} strokeWidth={2} aria-hidden="true" />
                        <h1>{t("payment.title")}</h1>
                    </div>
                    <p>{t("payment.description")}</p>
                </div>
            </header>

            <ol className={styles.steps} aria-label={t("payment.steps.label")}>
                {paymentSteps.map((step, index) => (
                    <li
                        key={step}
                        className={`${styles.step} ${index < currentStep ? styles.stepComplete : ""} ${index === currentStep ? styles.stepCurrent : ""}`}
                        aria-current={index === currentStep ? "step" : undefined}
                    >
                        <span className={styles.stepNumber} aria-hidden="true">
                            {index < currentStep ? "✓" : index + 1}
                        </span>
                        <span>{step}</span>
                    </li>
                ))}
            </ol>

            {createdPayment ? (
                <Card className={styles.resultCard}>
                    <div className={`${styles.resultBanner} ${resultStatus === "completed"
                        ? styles.resultCompleted
                        : resultStatus === "pending_approval"
                            ? styles.resultPending
                            : resultStatus === "rejected"
                                ? styles.resultRejected
                                : styles.resultUnknown}`}>
                        <span className={styles.resultIcon} aria-hidden="true">
                            {resultStatus === "completed" ? <CircleCheck size={24} />
                                : resultStatus === "pending_approval" ? <Clock3 size={24} />
                                    : resultStatus === "rejected" ? <TriangleAlert size={24} />
                                        : <CreditCard size={24} />}
                        </span>
                        <div>
                            <span className={styles.eyebrow}>{t("payment.result.eyebrow")}</span>
                            <h2>{resultTitle}</h2>
                            <p role="status" aria-live="polite">{resultMessage}</p>
                        </div>
                    </div>

                    <div className={styles.resultAmount}>
                        <span>{t("payment.fields.amount")}</span>
                        <strong>{createdPayment.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {createdPayment.currency}</strong>
                    </div>

                    <dl className={styles.resultDetails}>
                        <div>
                            <dt>{t("payment.fields.iban")}</dt>
                            <dd>{createdPayment.toIban}</dd>
                        </div>
                        {resultAccountName && (
                            <div>
                                <dt>{t("payment.result.sourceAccount")}</dt>
                                <dd>{resultAccountName}</dd>
                            </div>
                        )}
                        {createdPayment.reference && (
                            <div>
                                <dt>{t("payment.fields.reference")}</dt>
                                <dd>{createdPayment.reference}</dd>
                            </div>
                        )}
                        <div>
                            <dt>{t("payment.result.submittedAt")}</dt>
                            <dd>{createdAtLabel}</dd>
                        </div>
                    </dl>

                    <Button type="button" variant="primary" size="medium" onClick={startNewPayment}>
                        {t("payment.actions.newPayment")}
                    </Button>
                </Card>
            ) : (
            <div className={styles.layout}>
                <Card className={styles.formCard}>
                    <form noValidate onSubmit={handleSubmit}>
                        <div className={styles.sectionHeading}>
                            <div className={styles.number}>01</div>

                            <div>
                                <h2>{t("payment.details.title")}</h2>
                                <p>{t("payment.details.description")}</p>
                            </div>
                        </div>

                        <div className={styles.formFields}>
                        <label className={styles.accountField}>
                            {t("payment.fields.fromAccount")}
                            <select
                                value={selectedAccount?.id ?? ""}
                                aria-invalid={Boolean(fieldErrors.fromAccountId)}
                                aria-describedby={describedBy(fieldErrors.fromAccountId && "from-account-error")}
                                disabled={isLoadingAccounts || accountsError || isSubmitting}
                                onChange={(event) => updateField("fromAccountId", event.target.value)}
                            >
                                {accounts.length === 0 && (
                                    <option value="">
                                        {isLoadingAccounts
                                            ? t("payment.loadingAccounts")
                                            : t(accountsError ? "payment.errors.loadAccounts" : "payment.errors.noAccounts")}
                                    </option>
                                )}

                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} · {account.balance.toLocaleString(locale)} {account.currency}
                                    </option>
                                ))}
                            </select>

                            {accountsError && (
                                <p className={styles.fieldError}>{t("payment.errors.loadAccounts")}</p>
                            )}
                            {fieldErrors.fromAccountId && (
                                <p id="from-account-error" className={styles.fieldError}>{fieldErrors.fromAccountId}</p>
                            )}
                        </label>

                        <label className={styles.recipientField}>
                            {t("payment.fields.recipient")}
                            <input
                                required
                                value={form.recipient}
                                placeholder={t("payment.placeholders.recipient")}
                                aria-invalid={Boolean(fieldErrors.recipient)}
                                aria-describedby={describedBy(fieldErrors.recipient && "recipient-error")}
                                onChange={(event) => updateField("recipient", event.target.value)}
                            />
                            {fieldErrors.recipient && (
                                <p id="recipient-error" className={styles.fieldError}>{fieldErrors.recipient}</p>
                            )}
                        </label>

                        <label className={styles.ibanField}>
                            {t("payment.fields.iban")}
                            <input
                                required
                                value={form.iban}
                                placeholder="SE00 0000 0000 0000 0000 0000"
                                aria-invalid={Boolean(fieldErrors.iban) || (hasIbanInput && !ibanIsValid)}
                                aria-describedby={describedBy(
                                    "iban-hint",
                                    hasIbanInput && "iban-validation",
                                    fieldErrors.iban && "iban-error"
                                )}
                                onChange={(event) => updateField("iban", event.target.value)}
                            />
                            {hasIbanInput && (
                                <p
                                    className={`${styles.ibanValidation} ${ibanIsValid ? styles.ibanValid : styles.ibanInvalid}`}
                                    id="iban-validation"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span aria-hidden="true">{ibanIsValid ? "✓" : "!"}</span>
                                    {t(ibanIsValid ? "payment.iban.valid" : "payment.iban.invalid")}
                                </p>
                            )}
                            {fieldErrors.iban && (
                                <p id="iban-error" className={styles.fieldError}>{fieldErrors.iban}</p>
                            )}
                            <p id="iban-hint" className={styles.ibanHint}>{t("payment.iban.accountNotChecked")}</p>
                        </label>

                        <label className={styles.amountField}>
                            {t("payment.fields.amount")}
                            <div className={styles.amountInput}>
                                <input
                                    required
                                    min="1"
                                    step="0.01"
                                    type="number"
                                    value={form.amount}
                                    placeholder="0.00"
                                    aria-invalid={Boolean(fieldErrors.amount)}
                                    aria-describedby={describedBy(fieldErrors.amount && "amount-error")}
                                    onChange={(event) => updateField("amount", event.target.value)}
                                />
                                <span>SEK</span>
                            </div>
                            {fieldErrors.amount && (
                                <p id="amount-error" className={styles.fieldError}>{fieldErrors.amount}</p>
                            )}
                        </label>

                        <label className={styles.referenceField}>
                            {t("payment.fields.reference")}
                            <input
                                value={form.reference}
                                placeholder={t("payment.placeholders.reference")}
                                aria-invalid={Boolean(fieldErrors.reference)}
                                aria-describedby={describedBy(fieldErrors.reference && "reference-error")}
                                onChange={(event) => updateField("reference", event.target.value)}
                            />
                            {fieldErrors.reference && (
                                <p id="reference-error" className={styles.fieldError}>{fieldErrors.reference}</p>
                            )}
                        </label>

                        <label className={styles.messageField}>
                            {t("payment.fields.message")}{" "}
                            <span className={styles.optional}>{t("payment.optional")}</span>

                            <textarea
                                rows={2}
                                value={form.message}
                                placeholder={t("payment.placeholders.message")}
                                aria-invalid={Boolean(fieldErrors.message)}
                                aria-describedby={describedBy(fieldErrors.message && "message-error")}
                                onChange={(event) => updateField("message", event.target.value)}
                            />
                            {fieldErrors.message && (
                                <p id="message-error" className={styles.fieldError}>{fieldErrors.message}</p>
                            )}
                        </label>
                        </div>

                        {error && (
                            <div className={styles.error} role="alert">
                                <TriangleAlert size={18} aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button type="button" variant="ghost" size="medium" onClick={clearForm}>
                                <span className={styles.buttonContent}>
                                    <RotateCcw size={17} aria-hidden="true" />
                                    {t("payment.actions.clear")}
                                </span>
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                size="medium"
                                disabled={isSubmitting || isLoadingAccounts || accountsError || accounts.length === 0}
                            >
                                <span className={styles.buttonContent}>
                                    {t("payment.actions.continueToReview")}
                                    <ArrowRight size={17} aria-hidden="true" />
                                </span>
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
            )}

            {isReviewOpen && (
                <div
                    className={styles.modalBackdrop}
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsReviewOpen(false);
                        }
                    }}
                >
                    <section
                        className={styles.reviewModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-payment-title"
                    >
                        <p className={styles.eyebrow}>{t("payment.review.eyebrow")}</p>
                        <div className={styles.reviewTitle}>
                            <ClipboardCheck size={22} strokeWidth={2} aria-hidden="true" />
                            <h2 id="review-payment-title">{t("payment.review.title")}</h2>
                        </div>
                        <p className={styles.reviewIntro}>{t("payment.review.description")}</p>

                        <div className={styles.reviewDetails}>
                            <div>
                                <span>{t("payment.fields.recipient")}</span>
                                <strong>{form.recipient}</strong>
                            </div>

                            <div>
                                <span>{t("payment.fields.iban")}</span>
                                <strong>{form.iban}</strong>
                            </div>

                            <div>
                                <span>{t("payment.fields.amount")}</span>
                                <strong>
                                    {amount.toLocaleString(locale, { minimumFractionDigits: 2 })} SEK
                                </strong>
                            </div>

                            <div>
                                <span>{t("payment.fields.fromAccount")}</span>
                                <strong>{selectedAccount?.name}</strong>
                            </div>

                            <div>
                                <span>{t("payment.fields.reference")}</span>
                                <strong>{form.reference || t("payment.summary.notSpecified")}</strong>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="medium"
                                onClick={() => setIsReviewOpen(false)}
                            >
                                <span className={styles.buttonContent}>
                                    <ArrowLeft size={17} aria-hidden="true" />
                                    {t("payment.actions.goBack")}
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                size="medium"
                                onClick={confirmPayment}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    t("payment.actions.creating")
                                ) : (
                                    <span className={styles.buttonContent}>
                                        <CircleCheck size={17} aria-hidden="true" />
                                        {t("payment.actions.confirm")}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}