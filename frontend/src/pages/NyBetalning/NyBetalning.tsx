import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    ArrowRight,
    CircleCheck,
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
    const currentStep = createdPayment ? 2 : isReviewOpen ? 1 : 0;
    const paymentSteps = [
        t("payment.steps.details"),
        t("payment.steps.review"),
        t("payment.steps.result"),
    ];

    const resultStatus = createdPayment?.status.toLowerCase().replaceAll("-", "_");
    const resultMessage = resultStatus === "completed"
        ? t("payment.result.completed")
        : resultStatus === "pending_approval"
            ? t("payment.result.pendingApproval")
            : resultStatus === "rejected"
                ? t("payment.result.rejected")
                : t("payment.result.accepted");
    const resultStatusLabel = resultStatus === "completed"
        ? t("payment.result.statusValues.completed")
        : resultStatus === "pending_approval"
            ? t("payment.result.statusValues.pendingApproval")
            : resultStatus === "rejected"
                ? t("payment.result.statusValues.rejected")
                : createdPayment?.status;

    function updateField(field: keyof PaymentForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setError(null);
        setIdempotencyKey(null);
    }

    function clearForm() {
        setForm(initialForm);
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
            setError(t("payment.errors.selectAccount"));
            return;
        }

        const validation = paymentSchema.safeParse(form);

        if (!validation.success) {
            setError(validation.error.issues[0].message);
            return;
        }

        if (amount > selectedAccount.balance) {
            setError(t("payment.errors.insufficientBalance"));
            return;
        }

        setError(null);
        setIsReviewOpen(true);
    }

    async function confirmPayment() {
        const validation = paymentSchema.safeParse(form);

        if (!validation.success || !selectedAccount) {
            setIsReviewOpen(false);
            setError(t("payment.errors.reviewDetails"));
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
                    <span className={styles.eyebrow}>{t("payment.result.eyebrow")}</span>
                    <h2>{t("payment.result.title")}</h2>
                    <p className={styles.resultMessage} role="status" aria-live="polite">
                        {resultMessage}
                    </p>

                    <dl className={styles.resultDetails}>
                        <div>
                            <dt>{t("payment.result.paymentId")}</dt>
                            <dd>{createdPayment.id}</dd>
                        </div>
                        <div>
                            <dt>{t("payment.fields.amount")}</dt>
                            <dd>{createdPayment.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {createdPayment.currency}</dd>
                        </div>
                        <div>
                            <dt>{t("payment.result.status")}</dt>
                            <dd>{resultStatusLabel}</dd>
                        </div>
                    </dl>

                    <Button type="button" variant="primary" size="medium" onClick={startNewPayment}>
                        {t("payment.actions.newPayment")}
                    </Button>
                </Card>
            ) : (
            <div className={styles.layout}>
                <Card className={styles.formCard}>
                    <form onSubmit={handleSubmit}>
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
                        </label>

                        <label className={styles.recipientField}>
                            {t("payment.fields.recipient")}
                            <input
                                required
                                value={form.recipient}
                                placeholder={t("payment.placeholders.recipient")}
                                onChange={(event) => updateField("recipient", event.target.value)}
                            />
                        </label>

                        <label className={styles.ibanField}>
                            {t("payment.fields.iban")}
                            <input
                                required
                                value={form.iban}
                                placeholder="SE00 0000 0000 0000 0000 0000"
                                aria-invalid={hasIbanInput && !ibanIsValid}
                                onChange={(event) => updateField("iban", event.target.value)}
                            />
                            {hasIbanInput && (
                                <p
                                    className={`${styles.ibanValidation} ${ibanIsValid ? styles.ibanValid : styles.ibanInvalid}`}
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span aria-hidden="true">{ibanIsValid ? "✓" : "!"}</span>
                                    {t(ibanIsValid ? "payment.iban.valid" : "payment.iban.invalid")}
                                </p>
                            )}
                            <p className={styles.ibanHint}>{t("payment.iban.accountNotChecked")}</p>
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
                                    onChange={(event) => updateField("amount", event.target.value)}
                                />
                                <span>SEK</span>
                            </div>
                        </label>

                        <label className={styles.referenceField}>
                            {t("payment.fields.reference")}
                            <input
                                value={form.reference}
                                placeholder={t("payment.placeholders.reference")}
                                onChange={(event) => updateField("reference", event.target.value)}
                            />
                        </label>

                        <label className={styles.messageField}>
                            {t("payment.fields.message")}{" "}
                            <span className={styles.optional}>{t("payment.optional")}</span>

                            <textarea
                                rows={2}
                                value={form.message}
                                placeholder={t("payment.placeholders.message")}
                                onChange={(event) => updateField("message", event.target.value)}
                            />
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