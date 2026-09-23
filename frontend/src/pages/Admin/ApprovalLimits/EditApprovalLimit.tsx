import {
    useState,
    type FormEvent,
} from "react";

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
} from "../../../schemas/approvalLimitsSchema";

import type {
    ApprovalLimit,
    UpdateApprovalLimit,
} from "../../../schemas/approvalLimitsSchema";

import { AppError } from "../../../errors/AppError";

import styles from "./EditApprovalLimit.module.css";

function getErrorMessage(
    error: unknown,
    fallback: string
) {
    if (error instanceof AppError) {
        return error.detail ?? error.message;
    }

    return fallback;
}

type EditApprovalLimitFormProps = {
    limit: ApprovalLimit;
};

function EditApprovalLimitForm({
    limit,
}: EditApprovalLimitFormProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] =
        useState(
            limit.minAmount.toString()
        );

    const [
        requiredApprovals,
        setRequiredApprovals,
    ] = useState(
        limit.requiredApprovals.toString()
    );

    const [description, setDescription] =
        useState(limit.description);

    const [
        validationError,
        setValidationError,
    ] = useState("");

    const [
        isDeleteModalOpen,
        setIsDeleteModalOpen,
    ] = useState(false);

    const updateMutation = useMutation({
        mutationFn: (
            data: UpdateApprovalLimit
        ) =>
            updateApprovalLimit(
                limit.id,
                data
            ),

        onSuccess: (updatedLimit) => {
            setMinAmount(
                updatedLimit.minAmount.toString()
            );

            setRequiredApprovals(
                updatedLimit.requiredApprovals.toString()
            );

            setDescription(
                updatedLimit.description
            );

            queryClient.setQueryData<
                ApprovalLimit[]
            >(
                ["approvalLimits"],
                (currentLimits) =>
                    currentLimits?.map(
                        (currentLimit) =>
                            currentLimit.id ===
                                updatedLimit.id
                                ? updatedLimit
                                : currentLimit
                    )
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () =>
            deleteApprovalLimit(limit.id),

        onSuccess: async () => {
            queryClient.setQueryData<
                ApprovalLimit[]
            >(
                ["approvalLimits"],
                (currentLimits) =>
                    currentLimits?.filter(
                        (currentLimit) =>
                            currentLimit.id !==
                            limit.id
                    )
            );

            await navigate({
                to: "/admin/approval-limits",
            });
        },

        onError: () => {
            setIsDeleteModalOpen(false);
        },
    });

    function handleUpdate(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setValidationError("");
        updateMutation.reset();

        const result =
            updateApprovalLimitSchema.safeParse({
                minAmount:
                    Number(minAmount),

                requiredApprovals:
                    Number(requiredApprovals),

                description:
                    description.trim(),
            });

        if (!result.success) {
            setValidationError(
                "Please enter valid approval limit values."
            );

            return;
        }

        updateMutation.mutate(
            result.data
        );
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
                <div>
                    <h1>
                        Edit approval limit
                    </h1>

                    <p>
                        Update the approval rule
                        for payments.
                    </p>
                </div>

                <Button
                    size="medium"
                    variant="danger"
                    disabled={isBusy}
                    onClick={() =>
                        setIsDeleteModalOpen(true)
                    }
                >
                    Delete limit
                </Button>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>
                        Approval rule
                    </h2>

                    <p>
                        Change the minimum amount,
                        number of approvals or
                        description.
                    </p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleUpdate}
                >
                    <div className={styles.formGroup}>
                        <label
                            htmlFor="minAmount"
                            className={styles.label}
                        >
                            Minimum amount
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
                            onChange={(event) =>
                                setMinAmount(
                                    event.target.value
                                )
                            }
                            required
                        />

                        <span
                            className={
                                styles.helperText
                            }
                        >
                            Payments from this
                            amount use this rule.
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="requiredApprovals"
                            className={styles.label}
                        >
                            Required approvals
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
                            onChange={(event) =>
                                setRequiredApprovals(
                                    event.target.value
                                )
                            }
                            required
                        />

                        <span
                            className={
                                styles.helperText
                            }
                        >
                            Number of approvals
                            required for the rule.
                        </span>
                    </div>

                    <div
                        className={
                            styles.descriptionGroup
                        }
                    >
                        <label
                            htmlFor="description"
                            className={styles.label}
                        >
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            className={
                                styles.textarea
                            }
                            value={description}
                            disabled={isBusy}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    {updateMutation.isSuccess && (
                        <div
                            className={
                                styles.success
                            }
                            role="status"
                        >
                            Approval limit updated
                            successfully.
                        </div>
                    )}

                    {validationError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {validationError}
                        </div>
                    )}

                    {updateMutation.isError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {getErrorMessage(
                                updateMutation.error,
                                "Unable to update approval limit."
                            )}
                        </div>
                    )}

                    {deleteMutation.isError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {getErrorMessage(
                                deleteMutation.error,
                                "Unable to delete approval limit."
                            )}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link
                            to="/admin/approval-limits"
                            className={
                                styles.cancelButton
                            }
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            variant="square"
                            size="medium"
                            disabled={isBusy}
                            className={
                                styles.formButton
                            }
                        >
                            {updateMutation.isPending ? (
                                <span
                                    className={
                                        styles.loadingButton
                                    }
                                >
                                    <LoadingWheel size="small" />

                                    Saving...
                                </span>
                            ) : (
                                "Save changes"
                            )}
                        </Button>
                    </div>
                </form>
            </section>

            <Modal
                isOpen={isDeleteModalOpen}
                title="Delete approval limit"
                onClose={() => {
                    if (
                        !deleteMutation.isPending
                    ) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={
                                deleteMutation.isPending
                            }
                            onClick={() =>
                                setIsDeleteModalOpen(
                                    false
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            disabled={
                                deleteMutation.isPending
                            }
                            onClick={handleDelete}
                        >
                            {deleteMutation.isPending ? (
                                <span
                                    className={
                                        styles.loadingButton
                                    }
                                >
                                    <LoadingWheel size="small" />

                                    Deleting...
                                </span>
                            ) : (
                                "Delete limit"
                            )}
                        </Button>
                    </>
                }
            >
                <p>
                    Are you sure you want to
                    delete this approval limit?
                </p>

                <p>
                    This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}

export default function EditApprovalLimit() {
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
            limits.find(
                (limit) =>
                    limit.id === id
            ),
    });

    if (isPending) {
        return (
            <div
                className={styles.loadingState}
                role="status"
                aria-live="polite"
            >
                <LoadingWheel size="medium" />

                <p>
                    Loading approval limit...
                </p>
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
                    "Unable to load approval limit."
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
                Approval limit could not be found.
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