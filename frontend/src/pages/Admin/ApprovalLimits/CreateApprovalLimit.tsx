import { useFormValidation } from "../../../components/FormValidation/useFormValidation";
import { FieldError, ErrorSummary } from "../../../components/FormValidation/FormErrors";
import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CircleCheck,
    Plus,
    ShieldCheck,
    TriangleAlert,
} from "lucide-react";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import { createApprovalLimit } from "../../../services/approvalLimitsService";
import { createApprovalLimitSchema } from "../../../schemas/approvalLimitsSchema";
import { AppError } from "../../../errors/AppError";

import styles from "./CreateApprovalLimit.module.css";

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AppError) return error.detail ?? error.message;
    return fallback;
}

export default function CreateApprovalLimit() {
    const { t } = useTranslation();
    const validation = useFormValidation();
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] = useState("");
    const [requiredApprovals, setRequiredApprovals] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useMutation({
        mutationFn: createApprovalLimit,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["approvalLimits"],
            });

            setMinAmount("");
            setRequiredApprovals("");
            setDescription("");
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        createMutation.reset();

        const result = createApprovalLimitSchema.safeParse({
            minAmount: Number(minAmount),
            requiredApprovals: Number(requiredApprovals),
            description: description.trim(),
        });

        const fieldErrors: Record<string, string> = {};
        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = String(issue.path[0]);
                fieldErrors[field] = t(`validation.approval.${field}`);
            }
        }
        if (!validation.validate(event.currentTarget, fieldErrors) || !result.success) return;

        createMutation.mutate(result.data);
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <ShieldCheck size={26} strokeWidth={2} aria-hidden="true" />

                    <div>
                        <h1>{t("approvalLimits.create.title")}</h1>
                        <p>{t("approvalLimits.create.description")}</p>
                    </div>
                </div>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("approvalLimits.form.title")}</h2>
                    <p>{t("approvalLimits.create.formDescription")}</p>
                </div>

                <form noValidate onChange={(event) => validation.clear((event.target as HTMLInputElement).id)} className={styles.form} onSubmit={handleSubmit}>
                    <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
                    <div className={styles.formGroup}>
                        <label htmlFor="minAmount" className={styles.label}>
                            {t("approvalLimits.form.minAmount")}
                        </label>

                        <input
                            id="minAmount"
                            {...validation.fieldProps("minAmount", "minAmount-hint")}
                            name="minAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            className={styles.input}
                            value={minAmount}
                            disabled={createMutation.isPending}
                            onChange={(event) => setMinAmount(event.target.value)}
                            placeholder="50000"
                            required
                        />
                        <FieldError id="minAmount" errors={validation.errors} />

                        <span id="minAmount-hint" className={styles.helperText}>
                            {t("approvalLimits.form.minAmountHelp")}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="requiredApprovals" className={styles.label}>
                            {t("approvalLimits.form.requiredApprovals")}
                        </label>

                        <input
                            id="requiredApprovals"
                            {...validation.fieldProps("requiredApprovals", "requiredApprovals-hint")}
                            name="requiredApprovals"
                            type="number"
                            min="1"
                            step="1"
                            className={styles.input}
                            value={requiredApprovals}
                            disabled={createMutation.isPending}
                            onChange={(event) => setRequiredApprovals(event.target.value)}
                            placeholder="2"
                            required
                        />
                        <FieldError id="requiredApprovals" errors={validation.errors} />

                        <span id="requiredApprovals-hint" className={styles.helperText}>
                            {t("approvalLimits.form.requiredApprovalsHelp")}
                        </span>
                    </div>

                    <div className={styles.descriptionGroup}>
                        <label htmlFor="description" className={styles.label}>
                            {t("approvalLimits.form.description")}
                        </label>

                        <textarea
                            id="description"
                            {...validation.fieldProps("description")}
                            name="description"
                            className={styles.textarea}
                            value={description}
                            disabled={createMutation.isPending}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={t("approvalLimits.form.descriptionPlaceholder")}
                            rows={4}
                            required
                        />
                        <FieldError id="description" errors={validation.errors} />
                    </div>

                    {createMutation.isSuccess && (
                        <div className={styles.success} role="status">
                            <CircleCheck size={18} aria-hidden="true" />

                            <span>
                                {t("approvalLimits.create.success", {
                                    description: createMutation.data.description,
                                })}
                            </span>
                        </div>
                    )}


                    {createMutation.isError && (
                        <div className={styles.error} role="alert">
                            <TriangleAlert size={18} aria-hidden="true" />

                            <span>
                                {getErrorMessage(
                                    createMutation.error,
                                    t("approvalLimits.errors.create")
                                )}
                            </span>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link
                            to="/admin/approval-limits"
                            className={styles.cancelButton}
                        >
                            <ArrowLeft size={17} aria-hidden="true" />
                            {t("common.cancel")}
                        </Link>

                        <Button
                            type="submit"
                            variant="square"
                            size="medium"
                            disabled={createMutation.isPending}
                            className={styles.formButton}
                        >
                            {createMutation.isPending ? (
                                <span className={styles.loadingButton}>
                                    <LoadingWheel size="small" />
                                    {t("approvalLimits.create.creating")}
                                </span>
                            ) : (
                                <span className={styles.buttonContent}>
                                    <Plus size={18} aria-hidden="true" />
                                    {t("approvalLimits.create.submit")}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
