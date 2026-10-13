import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { ErrorSummary, FieldError } from "../../components/FormValidation/FormErrors";
import { useFormValidation } from "../../components/FormValidation/useFormValidation";
import { useModalFocus } from "../../hooks/useModalFocus";
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
    const validation = useFormValidation();
    const { user } = useAuth();
    const { data: accounts = [], isLoading: isLoadingAccounts, isError: accountsError } = useAccounts();

    const [form, setForm] = useState(initialForm);
    const [createdPayment, setCreatedPayment] = useState<CreatedPayment | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const reviewHeadingRef = useRef<HTMLHeadingElement | null>(null);
    const reviewDialogRef = useRef<HTMLElement>(null);
    useModalFocus(isReviewOpen, reviewDialogRef, false);
    const resultHeadingRef = useRef<HTMLHeadingElement>(null);
    const restoreReviewFocusRef = useRef(false);

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
    const resultTitle = resultStatus === "completed"
        ? t("payment.result.completedTitle")
        : resultStatus === "pending_approval"
            ? t("payment.result.pendingTitle")
            : resultStatus === "rejected"
                ? t("payment.result.rejectedTitle")
                : t("payment.result.title");
    const resultTone = resultStatus === "completed"
        ? styles.resultCompleted
        : resultStatus === "pending_approval"
            ? styles.resultPending
            : resultStatus === "rejected"
                ? styles.resultRejected
                : styles.resultUnknown;
    const resultSourceAccount = createdPayment
        ? accounts.find((account) => account.id === String(createdPayment.fromAccountId))
        : undefined;
    const createdAtLabel = createdPayment
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })
            .format(new Date(createdPayment.createdAt))
        : undefined;
    const resultStatusLabel = resultStatus === "completed"
        ? t("payment.result.statusValues.completed")
        : resultStatus === "pending_approval"
            ? t("payment.result.statusValues.pendingApproval")
            : resultStatus === "rejected"
                ? t("payment.result.statusValues.rejected")
                : createdPayment?.status;

    useEffect(() => {
        if (!isReviewOpen) return;

        function handleDialogKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                restoreReviewFocusRef.current = true;
                setIsReviewOpen(false);
                return;
            }

            if (event.key !== "Tab") return;

            const dialog = document.getElementById("review-payment-dialog");
            if (!dialog) return;

            const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
            ));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (!first || !last) {
                event.preventDefault();
                reviewHeadingRef.current?.focus();
            } else if (event.shiftKey && (document.activeElement === first || document.activeElement === reviewHeadingRef.current)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener("keydown", handleDialogKeyDown);
        return () => {
            document.removeEventListener("keydown", handleDialogKeyDown);
        };
    }, [isReviewOpen]);

    useLayoutEffect(() => {
        if (isReviewOpen) {
            reviewHeadingRef.current?.focus();
            return;
        }

        if (restoreReviewFocusRef.current) {
            restoreReviewFocusRef.current = false;
            formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
        }
    }, [isReviewOpen]);

    useLayoutEffect(() => {
        if (createdPayment) resultHeadingRef.current?.focus();
    }, [createdPayment]);

    function closeReview() {
        restoreReviewFocusRef.current = true;
        setIsReviewOpen(false);
    }

    function updateField(field: keyof PaymentForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        validation.clear(String(field));
        setError(null);
        setIdempotencyKey(null);
    }

    function clearForm() {
        setForm(initialForm);
        validation.clear();
        setError(null);
        setIdempotencyKey(null);
    }

    function startNewPayment() {
        setCreatedPayment(null);
        clearForm();
    }

    function validatePaymentForm(formElement: HTMLFormElement, formData: PaymentForm, currentAmount: number) {
        const result = paymentSchema.safeParse(formData);
        const customErrors: Record<string, string> = {};

        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = String(issue.path[0] ?? "");
                if (field && !customErrors[field]) customErrors[field] = t(issue.message);
            }
        }

        if (!selectedAccount) {
            customErrors.fromAccountId = t("payment.errors.selectAccount");
        } else if (currentAmount > selectedAccount.balance) {
            customErrors.amount = t("payment.errors.insufficientBalance");
        }

        const nativeValidationPassed = validation.validate(formElement, customErrors);
        return { isValid: nativeValidationPassed && result.success && Boolean(selectedAccount), result };
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const { isValid } = validatePaymentForm(event.currentTarget, {
            ...form,
            fromAccountId: selectedAccount?.id ?? form.fromAccountId,
        }, amount);
        if (!isValid) return;

        setError(null);
        setIsReviewOpen(true);
    }

    async function confirmPayment() {
        const formElement = document.querySelector<HTMLFormElement>("form");
        if (!formElement) return;

        const { isValid, result } = validatePaymentForm(formElement, {
            ...form,
            fromAccountId: selectedAccount?.id ?? form.fromAccountId,
        }, amount);

        if (!isValid || !result.success || !selectedAccount) {
            setIsReviewOpen(false);
            return;
        }

        const validatedForm = result.data;
        const paymentIdempotencyKey = idempotencyKey ?? crypto.randomUUID();

        if (!idempotencyKey) {
            setIdempotencyKey(paymentIdempotencyKey);
        }

        setIsSubmitting(true);

        try {
            const payment = await createPayment(
                {
                    tenantId: user?.tenantId ?? 0,
                    fromAccountId: selectedAccount.id,
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
            validation.clear();
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
                    <div className={`${styles.resultBanner} ${resultTone}`}>
                        <span className={styles.resultIcon} aria-hidden="true">
                            {resultStatus === "completed" ? <CircleCheck size={24} /> : <TriangleAlert size={24} />}
                        </span>
                        <div>
                            <h2 ref={resultHeadingRef} tabIndex={-1}>{resultTitle}</h2>
                            <p role="status" aria-live="polite">{resultMessage}</p>
                        </div>
                    </div>

                    <div className={styles.resultAmount}>
                        <span>{t("payment.fields.amount")}</span>
                        <strong>{createdPayment.amount.toLocaleString(locale, { minimumFractionDigits: 2 })} {createdPayment.currency}</strong>
                    </div>

                    <dl className={styles.resultDetails}>
                        <div>
                            <dt>{t("payment.result.status")}</dt>
                            <dd>{resultStatusLabel}</dd>
                        </div>
                        {resultSourceAccount && (
                            <div>
                                <dt>{t("payment.result.sourceAccount")}</dt>
                                <dd>{resultSourceAccount.name}</dd>
                            </div>
                        )}
                        <div>
                            <dt>{t("payment.fields.iban")}</dt>
                            <dd>{createdPayment.toIban}</dd>
                        </div>
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
                    <form
                        ref={formRef}
                        noValidate
                        onSubmit={handleSubmit}
                        onChange={(event) => validation.clear((event.target as HTMLElement).id)}
                    >
                        <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
                        <div className={styles.sectionHeading}>
                            <div className={styles.number}>01</div>

                            <div>
                                <h2>{t("payment.details.title")}</h2>
                                <p>{t("payment.details.description")}</p>
                            </div>
                        </div>

                        <div className={styles.formFields}>
                        <label className={styles.accountField} htmlFor="fromAccountId">
                            {t("payment.fields.fromAccount")}
                            <select
                                id="fromAccountId"
                                name="fromAccountId"
                                value={selectedAccount?.id ?? ""}
                                {...validation.fieldProps("fromAccountId", accountsError || isLoadingAccounts ? "source-account-status" : undefined)}
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
                            {(accountsError || isLoadingAccounts) && (
                                <span id="source-account-status" role={accountsError ? "alert" : "status"}>
                                    {t(accountsError ? "payment.errors.loadAccounts" : "payment.loadingAccounts")}
                                </span>
                            )}

                            {accountsError && (
                                <p className={styles.fieldError}>{t("payment.errors.loadAccounts")}</p>
                            )}
                            <FieldError id="fromAccountId" errors={validation.errors} />
                        </label>

                        <label className={styles.recipientField} htmlFor="recipient">
                            {t("payment.fields.recipient")}
                            <input
                                id="recipient"
                                name="recipient"
                                required
                                value={form.recipient}
                                placeholder={t("payment.placeholders.recipient")}
                                {...validation.fieldProps("recipient")}
                                onChange={(event) => updateField("recipient", event.target.value)}
                            />
                            <FieldError id="recipient" errors={validation.errors} />
                        </label>

                        <label className={styles.ibanField} htmlFor="iban">
                            {t("payment.fields.iban")}
                            <input
                                id="iban"
                                name="iban"
                                required
                                value={form.iban}
                                placeholder="SE00 0000 0000 0000 0000 0000"
                                {...validation.fieldProps("iban", "iban-hint")}
                                aria-invalid={Boolean(validation.errors.iban) || (hasIbanInput && !ibanIsValid)}
                                aria-describedby={[
                                    validation.errors.iban ? "iban-error" : undefined,
                                    hasIbanInput ? "iban-validation" : undefined,
                                    "iban-hint",
                                ].filter(Boolean).join(" ")}
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
                            <FieldError id="iban" errors={validation.errors} />
                            <p id="iban-hint" className={styles.ibanHint}>{t("payment.iban.accountNotChecked")}</p>
                        </label>

                        <label className={styles.amountField} htmlFor="amount">
                            {t("payment.fields.amount")}
                            <div className={styles.amountInput}>
                                <input
                                    id="amount"
                                    name="amount"
                                    required
                                    min="1"
                                    step="0.01"
                                    type="number"
                                    value={form.amount}
                                    placeholder="0.00"
                                    {...validation.fieldProps("amount")}
                                    onChange={(event) => updateField("amount", event.target.value)}
                                />
                                <span>SEK</span>
                            </div>
                            <FieldError id="amount" errors={validation.errors} />
                        </label>

                        <label className={styles.referenceField} htmlFor="reference">
                            {t("payment.fields.reference")}
                            <input
                                id="reference"
                                name="reference"
                                value={form.reference}
                                placeholder={t("payment.placeholders.reference")}
                                {...validation.fieldProps("reference")}
                                onChange={(event) => updateField("reference", event.target.value)}
                            />
                            <FieldError id="reference" errors={validation.errors} />
                        </label>

                        <label className={styles.messageField} htmlFor="message">
                            {t("payment.fields.message")}{" "}
                            <span className={styles.optional}>{t("payment.optional")}</span>

                            <textarea
                                id="message"
                                name="message"
                                rows={2}
                                value={form.message}
                                placeholder={t("payment.placeholders.message")}
                                {...validation.fieldProps("message")}
                                onChange={(event) => updateField("message", event.target.value)}
                            />
                            <FieldError id="message" errors={validation.errors} />
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
                            closeReview();
                        }
                    }}
                >
                    <section
                        className={styles.reviewModal}
                        ref={reviewDialogRef}
                        id="review-payment-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="review-payment-title"
                        aria-describedby="review-payment-description"
                    >
                        <p className={styles.eyebrow}>{t("payment.review.eyebrow")}</p>
                        <div className={styles.reviewTitle}>
                            <ClipboardCheck size={22} strokeWidth={2} aria-hidden="true" />
                            <h2 id="review-payment-title" ref={reviewHeadingRef} tabIndex={-1}>
                                {t("payment.review.title")}
                            </h2>
                        </div>
                        <p id="review-payment-description" className={styles.reviewIntro}>
                            {t("payment.review.description")}
                        </p>

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
                                onClick={closeReview}
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
