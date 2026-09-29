import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccounts } from "../../hooks/useAccounts";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { createPayment } from "../../services/accountService";
import { paymentSchema, type PaymentForm } from "../../schemas/paymentSchema";

import styles from "./NyBetalning.module.css";

const initialForm: PaymentForm = {
    fromAccountId: "1",
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
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

    const selectedAccount = accounts.find((account) => account.id === form.fromAccountId);
    const amount = Number(form.amount) || 0;
    const locale = i18n.resolvedLanguage === "sv" ? "sv-SE" : "en-SE";

    function updateField(field: keyof PaymentForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setSubmitted(false);
        setError(null);
        setIdempotencyKey(null);
    }

    function clearForm() {
        setForm(initialForm);
        setSubmitted(false);
        setError(null);
        setIdempotencyKey(null);
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
        setSubmitted(false);
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

        setIsReviewOpen(false);
        setIsSubmitting(true);

        try {
            await createPayment(
                {
                    tenantId: user?.tenantId ?? 0,
                    fromAccountId: Number(validatedForm.fromAccountId),
                    toIban: validatedForm.iban,
                    amount: Number(validatedForm.amount),
                    currency: "SEK",
                    reference: validatedForm.reference,
                },
                paymentIdempotencyKey
            );

            setSubmitted(true);
            setForm(initialForm);
            setIdempotencyKey(null);
        } catch {
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
                    <h1>{t("payment.title")}</h1>
                    <p>{t("payment.description")}</p>
                </div>
            </header>

            <div className={styles.layout}>
                <Card>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.sectionHeading}>
                            <div className={styles.number}>01</div>

                            <div>
                                <h2>{t("payment.details.title")}</h2>
                                <p>{t("payment.details.description")}</p>
                            </div>
                        </div>

                        <label>
                            {t("payment.fields.fromAccount")}
                            <select
                                value={form.fromAccountId}
                                disabled={isLoadingAccounts || accountsError || isSubmitting}
                                onChange={(event) => updateField("fromAccountId", event.target.value)}
                            >
                                {isLoadingAccounts && (
                                    <option>{t("payment.loadingAccounts")}</option>
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

                        <label>
                            {t("payment.fields.recipient")}
                            <input
                                required
                                value={form.recipient}
                                placeholder={t("payment.placeholders.recipient")}
                                onChange={(event) => updateField("recipient", event.target.value)}
                            />
                        </label>

                        <label>
                            {t("payment.fields.iban")}
                            <input
                                required
                                value={form.iban}
                                placeholder="SE00 0000 0000 0000 0000 0000"
                                onChange={(event) => updateField("iban", event.target.value)}
                            />
                        </label>

                        <div className={styles.fieldGrid}>
                            <label>
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

                            <label>
                                {t("payment.fields.reference")}
                                <input
                                    value={form.reference}
                                    placeholder={t("payment.placeholders.reference")}
                                    onChange={(event) => updateField("reference", event.target.value)}
                                />
                            </label>
                        </div>

                        <label>
                            {t("payment.fields.message")}{" "}
                            <span className={styles.optional}>{t("payment.optional")}</span>

                            <textarea
                                rows={3}
                                value={form.message}
                                placeholder={t("payment.placeholders.message")}
                                onChange={(event) => updateField("message", event.target.value)}
                            />
                        </label>

                        {submitted && (
                            <div className={styles.success}>
                                {t("payment.success")}
                            </div>
                        )}

                        {error && (
                            <div className={styles.error}>{error}</div>
                        )}

                        <div className={styles.actions}>
                            <Button type="button" variant="ghost" size="medium" onClick={clearForm}>
                                {t("payment.actions.clear")}
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                size="medium"
                                disabled={isSubmitting || isLoadingAccounts || accountsError}
                            >
                                {t("payment.actions.review")}
                                <span aria-hidden="true">→</span>
                            </Button>
                        </div>
                    </form>
                </Card>

                <Card
                    title={t("payment.summary.title")}
                    variant="primary"
                    className={styles.summary}
                >
                    <div className={styles.summaryAmount}>
                        <span>{t("payment.summary.amountToPay")}</span>
                        <strong>
                            {amount.toLocaleString(locale, { minimumFractionDigits: 2 })} SEK
                        </strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>{t("payment.fields.recipient")}</span>
                        <strong>{form.recipient || t("payment.summary.notSpecified")}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>{t("payment.summary.recipientIban")}</span>
                        <strong>{form.iban || t("payment.summary.notSpecified")}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>{t("payment.fields.reference")}</span>
                        <strong>{form.reference || t("payment.summary.notSpecified")}</strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>{t("payment.fields.fromAccount")}</span>
                        <strong>
                            {selectedAccount?.name ?? t("payment.summary.selectAccount")}
                        </strong>
                    </div>

                    <div className={styles.summaryRow}>
                        <span>{t("payment.summary.balanceAfterPayment")}</span>
                        <strong>
                            {selectedAccount
                                ? (selectedAccount.balance - amount).toLocaleString(locale)
                                : "0"}{" "}
                            SEK
                        </strong>
                    </div>

                    <div className={styles.approval}>
                        <span className={styles.approvalIcon} aria-hidden="true">✓</span>

                        <div>
                            <strong>{t("payment.approval.title")}</strong>
                            <p>{t("payment.approval.description")}</p>
                        </div>
                    </div>
                </Card>
            </div>

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
                        <h2 id="review-payment-title">{t("payment.review.title")}</h2>
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

                            {form.reference && (
                                <div>
                                    <span>{t("payment.fields.reference")}</span>
                                    <strong>{form.reference}</strong>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <Button
                                type="button"
                                variant="ghost"
                                size="medium"
                                onClick={() => setIsReviewOpen(false)}
                            >
                                {t("payment.actions.goBack")}
                            </Button>

                            <Button
                                type="button"
                                variant="primary"
                                size="medium"
                                onClick={confirmPayment}
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? t("payment.actions.creating")
                                    : t("payment.actions.confirm")}
                            </Button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}