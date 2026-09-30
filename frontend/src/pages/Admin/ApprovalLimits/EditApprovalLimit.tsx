import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import Modal from "../../../components/Modal/Modal";

import {
    deleteApprovalLimit,
    getApprovalLimits,
    updateApprovalLimit,
} from "../../../services/approvalLimitsService";

import {
    updateApprovalLimitSchema,
    type ApprovalLimit,
    type UpdateApprovalLimit,
} from "../../../schemas/approvalLimitsSchema";

import { AppError } from "../../../errors/AppError";

import styles from "./EditApprovalLimit.module.css";

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AppError) return error.detail ?? error.message;
    return fallback;
}

type EditApprovalLimitFormProps = {
    limit: ApprovalLimit;
};

function EditApprovalLimitForm({ limit }: EditApprovalLimitFormProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] = useState(limit.minAmount.toString());
    const [requiredApprovals, setRequiredApprovals] = useState(limit.requiredApprovals.toString());
    const [description, setDescription] = useState(limit.description);
    const [validationError, setValidationError] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const updateMutation = useMutation({
        mutationFn: (data: UpdateApprovalLimit) => updateApprovalLimit(limit.id, data),

        onSuccess: (updatedLimit) => {
            setMinAmount(updatedLimit.minAmount.toString());
            setRequiredApprovals(updatedLimit.requiredApprovals.toString());
            setDescription(updatedLimit.description);

            queryClient.setQueryData<ApprovalLimit[]>(
                ["approvalLimits"],
                (currentLimits) =>
                    currentLimits?.map((currentLimit) =>
                        currentLimit.id === updatedLimit.id ? updatedLimit : currentLimit
                    )
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteApprovalLimit(limit.id),

        onSuccess: async () => {
            queryClient.setQueryData<ApprovalLimit[]>(
                ["approvalLimits"],
                (currentLimits) =>
                    currentLimits?.filter((currentLimit) => currentLimit.id !== limit.id)
            );

            await navigate({ to: "/admin/approval-limits" });
        },

        onError: () => setIsDeleteModalOpen(false),
    });

    function handleUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setValidationError("");
        updateMutation.reset();

        const result = updateApprovalLimitSchema.safeParse({
            minAmount: Number(minAmount),
            requiredApprovals: Number(requiredApprovals),
            description: description.trim(),
        });

        if (!result.success) {
            setValidationError(t("approvalLimits.errors.validation"));
            return;
        }

        updateMutation.mutate(result.data);
    }

    function handleDelete() {
        deleteMutation.mutate();
    }

    const isBusy = updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>{t("approvalLimits.edit.title")}</h1>
                    <p>{t("approvalLimits.edit.description")}</p>
                </div>

                <Button
                    size="medium"
                    variant="danger"
                    disabled={isBusy}
                    onClick={() => setIsDeleteModalOpen(true)}
                >
                    {t("approvalLimits.edit.delete")}
                </Button>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("approvalLimits.form.title")}</h2>
                    <p>{t("approvalLimits.edit.formDescription")}</p>
                </div>

                <form className={styles.form} onSubmit={handleUpdate}>
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
                            disabled={isBusy}
                            onChange={(event) => setMinAmount(event.target.value)}
                            required
                        />

                        <span className={styles.helperText}>
                            {t("approvalLimits.form.minAmountEditHelp")}
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
                            disabled={isBusy}
                            onChange={(event) => setRequiredApprovals(event.target.value)}
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
                            rows={4}
                            className={styles.textarea}
                            value={description}
                            disabled={isBusy}
                            onChange={(event) => setDescription(event.target.value)}
                            required
                        />
                    </div>

                    {updateMutation.isSuccess && (
                        <div className={styles.success} role="status">
                            {t("approvalLimits.edit.success")}
                        </div>
                    )}

                    {validationError && (
                        <div className={styles.error} role="alert">
                            {validationError}
                        </div>
                    )}

                    {updateMutation.isError && (
                        <div className={styles.error} role="alert">
                            {getErrorMessage(
                                updateMutation.error,
                                t("approvalLimits.errors.update")
                            )}
                        </div>
                    )}

                    {deleteMutation.isError && (
                        <div className={styles.error} role="alert">
                            {getErrorMessage(
                                deleteMutation.error,
                                t("approvalLimits.errors.delete")
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
                            disabled={isBusy}
                            className={styles.formButton}
                        >
                            {updateMutation.isPending ? (
                                <span className={styles.loadingButton}>
                                    <LoadingWheel size="small" />
                                    {t("approvalLimits.edit.saving")}
                                </span>
                            ) : (
                                t("approvalLimits.edit.save")
                            )}
                        </Button>
                    </div>
                </form>
            </section>

            <Modal
                isOpen={isDeleteModalOpen}
                title={t("approvalLimits.deleteModal.title")}
                onClose={() => {
                    if (!deleteMutation.isPending) setIsDeleteModalOpen(false);
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={deleteMutation.isPending}
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            {t("common.cancel")}
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={handleDelete}
                        >
                            {deleteMutation.isPending ? (
                                <span className={styles.loadingButton}>
                                    <LoadingWheel size="small" />
                                    {t("approvalLimits.deleteModal.deleting")}
                                </span>
                            ) : (
                                t("approvalLimits.edit.delete")
                            )}
                        </Button>
                    </>
                }
            >
                <p>{t("approvalLimits.deleteModal.confirm")}</p>
                <p>{t("approvalLimits.deleteModal.warning")}</p>
            </Modal>
        </div>
    );
}

export default function EditApprovalLimit() {
    const { t } = useTranslation();

    const { limitId } = useParams({
        from: "/admin/approval-limits/$limitId/edit",
    });

    const id = Number(limitId);

    const {
        data: limit,
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ["approvalLimits"],
        queryFn: getApprovalLimits,
        select: (limits) => limits.find((limit) => limit.id === id),
    });

    if (isPending) {
        return (
            <div className={styles.loadingState} role="status" aria-live="polite">
                <LoadingWheel size="medium" />
                <p>{t("approvalLimits.edit.loading")}</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.error} role="alert">
                {getErrorMessage(error, t("approvalLimits.errors.loadOne"))}
            </div>
        );
    }

    if (!limit) {
        return (
            <div className={styles.error} role="alert">
                {t("approvalLimits.errors.notFound")}
            </div>
        );
    }

    return <EditApprovalLimitForm key={limit.id} limit={limit} />;
}