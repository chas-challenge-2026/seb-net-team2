import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] = useState("");
    const [requiredApprovals, setRequiredApprovals] = useState("");
    const [description, setDescription] = useState("");
    const [validationError, setValidationError] = useState("");

    const createMutation = useMutation({
        mutationFn: createApprovalLimit,

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["approvalLimits"] });

            setMinAmount("");
            setRequiredApprovals("");
            setDescription("");
        },
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setValidationError("");
        createMutation.reset();

        const result = createApprovalLimitSchema.safeParse({
            minAmount: Number(minAmount),
            requiredApprovals: Number(requiredApprovals),
            description: description.trim(),
        });

        if (!result.success) {
            setValidationError(t("approvalLimits.errors.validation"));
            return;
        }

        createMutation.mutate(result.data);
    }

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <h1>{t("approvalLimits.create.title")}</h1>
                <p>{t("approvalLimits.create.description")}</p>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("approvalLimits.form.title")}</h2>
                    <p>{t("approvalLimits.create.formDescription")}</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="minAmount" className={styles.label}>
                            {t("approvalLimits.form.minAmount")}
                        </label>

                        <input
                            id="minAmount"
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

                        <span className={styles.helperText}>
                            {t("approvalLimits.form.minAmountHelp")}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="requiredApprovals" className={styles.label}>
                            {t("approvalLimits.form.requiredApprovals")}
                        </label>

                        <input
                            id="requiredApprovals"
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

                        <span className={styles.helperText}>
                            {t("approvalLimits.form.requiredApprovalsHelp")}
                        </span>
                    </div>

                    <div className={styles.descriptionGroup}>
                        <label htmlFor="description" className={styles.label}>
                            {t("approvalLimits.form.description")}
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            className={styles.textarea}
                            value={description}
                            disabled={createMutation.isPending}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={t("approvalLimits.form.descriptionPlaceholder")}
                            rows={4}
                            required
                        />
                    </div>

                    {createMutation.isSuccess && (
                        <div className={styles.success} role="status">
                            {t("approvalLimits.create.success", {
                                description: createMutation.data.description,
                            })}
                        </div>
                    )}

                    {validationError && (
                        <div className={styles.error} role="alert">
                            {validationError}
                        </div>
                    )}

                    {createMutation.isError && (
                        <div className={styles.error} role="alert">
                            {getErrorMessage(
                                createMutation.error,
                                t("approvalLimits.errors.create")
                            )}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link to="/admin/approval-limits" className={styles.cancelButton}>
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
                                t("approvalLimits.create.submit")
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}