import { useFormValidation } from "../../../components/FormValidation/useFormValidation";
import { FieldError, ErrorSummary } from "../../../components/FormValidation/FormErrors";
import { useState, type FormEvent } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "@tanstack/react-router";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    CircleCheck,
    Save,
    ShieldCheck,
    Trash2,
    TriangleAlert,
} from "lucide-react";

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
    const validation = useFormValidation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] = useState(limit.minAmount.toString());
    const [requiredApprovals, setRequiredApprovals] = useState(
        limit.requiredApprovals.toString()
    );
    const [description, setDescription] = useState(limit.description);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const updateMutation = useMutation({
        mutationFn: (data: UpdateApprovalLimit) =>
            updateApprovalLimit(limit.id, data),

        onSuccess: (updatedLimit) => {
            setMinAmount(updatedLimit.minAmount.toString());
            setRequiredApprovals(updatedLimit.requiredApprovals.toString());
            setDescription(updatedLimit.description);

            queryClient.setQueryData<ApprovalLimit[]>(
                ["approvalLimits"],
                (currentLimits) =>
                    currentLimits?.map((currentLimit) =>
                        currentLimit.id === updatedLimit.id
                            ? updatedLimit
                            : currentLimit
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
                    currentLimits?.filter(
                        (currentLimit) => currentLimit.id !== limit.id
                    )
            );

            await navigate({
                to: "/admin/approval-limits",
            });
        },

        onError: () => setIsDeleteModalOpen(false),
    });

    function handleUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        updateMutation.reset();

        const result = updateApprovalLimitSchema.safeParse({
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

        updateMutation.mutate(result.data);
    }

    function handleDelete() {
        deleteMutation.mutate();
    }

    const isBusy =
        updateMutation.isPending ||
        deleteMutation.isPending;

    return (
        <div className={styles.layout}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <ShieldCheck
                        size={26}
                        strokeWidth={2}
                        aria-hidden="true"
                    />

                    <div>
                        <h1>{t("approvalLimits.edit.title")}</h1>
                        <p>{t("approvalLimits.edit.description")}</p>
                    </div>
                </div>

                <Button
                    size="medium"
                    variant="danger"
                    disabled={isBusy}
                    onClick={() => setIsDeleteModalOpen(true)}
                >
                    <span className={styles.buttonContent}>
                        <Trash2 size={18} aria-hidden="true" />
                        {t("approvalLimits.edit.delete")}
                    </span>
                </Button>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>{t("approvalLimits.form.title")}</h2>
                    <p>{t("approvalLimits.edit.formDescription")}</p>
                </div>

                <form noValidate onChange={(event) => validation.clear((event.target as HTMLInputElement).id)}
                    className={styles.form}
                    onSubmit={handleUpdate}
                >
                    <ErrorSummary errors={validation.errors} attempt={validation.attempt} />
                    <div className={styles.formGroup}>
                        <label
                            htmlFor="minAmount"
                            className={styles.label}
                        >
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
                            disabled={isBusy}
                            onChange={(event) =>
                                setMinAmount(event.target.value)
                            }
                            required
                        />
                        <FieldError id="minAmount" errors={validation.errors} />

                        <span id="minAmount-hint" className={styles.helperText}>
                            {t("approvalLimits.form.minAmountEditHelp")}
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="requiredApprovals"
                            className={styles.label}
                        >
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
                            disabled={isBusy}
                            onChange={(event) =>
                                setRequiredApprovals(event.target.value)
                            }
                            required
                        />
                        <FieldError id="requiredApprovals" errors={validation.errors} />

                        <span id="requiredApprovals-hint" className={styles.helperText}>
                            {t("approvalLimits.form.requiredApprovalsHelp")}
                        </span>
                    </div>

                    <div className={styles.descriptionGroup}>
                        <label
                            htmlFor="description"
                            className={styles.label}
                        >
                            {t("approvalLimits.form.description")}
                        </label>

                        <textarea
                            id="description"
                            {...validation.fieldProps("description")}
                            name="description"
                            rows={4}
                            className={styles.textarea}
                            value={description}
                            disabled={isBusy}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            required
                        />
                        <FieldError id="description" errors={validation.errors} />
                    </div>

                    {updateMutation.isSuccess && (
                        <div
                            className={styles.success}
                            role="status"
                        >
                            <CircleCheck
                                size={18}
                                aria-hidden="true"
                            />

                            <span>
                                {t("approvalLimits.edit.success")}
                            </span>
                        </div>
                    )}


                    {updateMutation.isError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            <TriangleAlert
                                size={18}
                                aria-hidden="true"
                            />

                            <span>
                                {getErrorMessage(
                                    updateMutation.error,
                                    t("approvalLimits.errors.update")
                                )}
                            </span>
                        </div>
                    )}

                    {deleteMutation.isError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            <TriangleAlert
                                size={18}
                                aria-hidden="true"
                            />

                            <span>
                                {getErrorMessage(
                                    deleteMutation.error,
                                    t("approvalLimits.errors.delete")
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
                            disabled={isBusy}
                            className={styles.formButton}
                        >
                            {updateMutation.isPending ? (
                                <span className={styles.loadingButton}>
                                    <LoadingWheel size="small" />
                                    {t("approvalLimits.edit.saving")}
                                </span>
                            ) : (
                                <span className={styles.buttonContent}>
                                    <Save size={18} aria-hidden="true" />
                                    {t("approvalLimits.edit.save")}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </section>

            <Modal
                isOpen={isDeleteModalOpen}
                title={t("approvalLimits.deleteModal.title")}
                onClose={() => {
                    if (!deleteMutation.isPending) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={deleteMutation.isPending}
                            onClick={() =>
                                setIsDeleteModalOpen(false)
                            }
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
                                <span className={styles.buttonContent}>
                                    <Trash2 size={18} aria-hidden="true" />
                                    {t("approvalLimits.edit.delete")}
                                </span>
                            )}
                        </Button>
                    </>
                }
            >
                <div className={styles.deleteWarning}>
                    <TriangleAlert
                        size={22}
                        strokeWidth={2}
                        aria-hidden="true"
                    />

                    <div>
                        <p>
                            {t("approvalLimits.deleteModal.confirm")}
                        </p>

                        <p>
                            {t("approvalLimits.deleteModal.warning")}
                        </p>
                    </div>
                </div>
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
        select: (limits) =>
            limits.find((limit) => limit.id === id),
    });

    if (isPending) {
        return (
            <div
                className={styles.loadingState}
                role="status"
                aria-live="polite"
            >
                <LoadingWheel size="medium" />
                <p>{t("approvalLimits.edit.loading")}</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div
                className={styles.error}
                role="alert"
            >
                {getErrorMessage(
                    error,
                    t("approvalLimits.errors.loadOne")
                )}
            </div>
        );
    }

    if (!limit) {
        return (
            <div
                className={styles.error}
                role="alert"
            >
                {t("approvalLimits.errors.notFound")}
            </div>
        );
    }

    return (
        <EditApprovalLimitForm
            key={limit.id}
            limit={limit}
        />
    );
}
