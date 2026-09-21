import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "@tanstack/react-router";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";
import Modal from "../../../components/Modal/Modal";


import { deleteApprovalLimit, getApprovalLimits, updateApprovalLimit } from "../../../services/approvalLimitsService";

import { updateApprovalLimitSchema } from "../../../schemas/approvalLimitsSchema";

import { AppError } from "../../../errors/AppError";

import styles from "./EditApprovalLimit.module.css";

export default function EditApprovalLimit() {
    const { limitId } = useParams({
        from: "/admin/approval-limits/$limitId/edit",
    });

    const navigate = useNavigate();

    const [minAmount, setMinAmount] =
        useState("");

    const [
        requiredApprovals,
        setRequiredApprovals,
    ] = useState("");

    const [description, setDescription] =
        useState("");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isUpdating, setIsUpdating] =
        useState(false);

    const [isDeleting, setIsDeleting] =
        useState(false);

    const [
        isDeleteModalOpen,
        setIsDeleteModalOpen,
    ] = useState(false);

    useEffect(() => {
        async function loadApprovalLimit() {
            try {
                setError("");
                setIsLoading(true);

                const limits =
                    await getApprovalLimits();

                const limit = limits.find(
                    (limit) =>
                        limit.id === Number(limitId)
                );

                if (!limit) {
                    setError(
                        "Approval limit could not be found."
                    );

                    return;
                }

                setMinAmount(
                    limit.minAmount.toString()
                );

                setRequiredApprovals(
                    limit.requiredApprovals.toString()
                );

                setDescription(
                    limit.description
                );
            } catch (error) {
                if (error instanceof AppError) {
                    setError(
                        error.detail ??
                        error.message
                    );
                } else {
                    setError(
                        "Unable to load approval limit."
                    );
                }
            } finally {
                setIsLoading(false);
            }
        }

        void loadApprovalLimit();
    }, [limitId]);

    async function handleUpdate(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

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
            setError(
                "Please enter valid approval limit values."
            );

            return;
        }

        setIsUpdating(true);

        try {
            const updatedLimit =
                await updateApprovalLimit(
                    Number(limitId),
                    result.data
                );

            setMinAmount(
                updatedLimit.minAmount.toString()
            );

            setRequiredApprovals(
                updatedLimit.requiredApprovals.toString()
            );

            setDescription(
                updatedLimit.description
            );

            setSuccess(
                "Approval limit updated successfully."
            );
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );
            } else {
                setError(
                    "Unable to update approval limit."
                );
            }
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleDelete() {
        setError("");
        setIsDeleting(true);

        try {
            await deleteApprovalLimit(
                Number(limitId)
            );

            await navigate({
                to: "/admin/approval-limits",
            });
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );
            } else {
                setError(
                    "Unable to delete approval limit."
                );
            }

            setIsDeleteModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading) {
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

    return (
        <div className={styles.layout}>
            <div className={styles.breadcrumb}>
                <Link
                    to="/admin/approval-limits"
                    className={styles.backLink}
                >
                    ← Approval limits
                </Link>
            </div>

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
                    disabled={
                        isUpdating ||
                        isDeleting
                    }
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
                            disabled={isUpdating}
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
                            disabled={isUpdating}
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
                            disabled={isUpdating}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    {success && (
                        <div
                            className={
                                styles.success
                            }
                            role="status"
                        >
                            {success}
                        </div>
                    )}

                    {error && (
                        <div
                            className={
                                styles.error
                            }
                            role="alert"
                        >
                            {error}
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
                            disabled={isUpdating}
                            className={
                                styles.formButton
                            }
                        >
                            {isUpdating ? (
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
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                    }
                }}
                footer={
                    <>
                        <Button
                            size="medium"
                            variant="square"
                            disabled={isDeleting}
                            onClick={() =>
                                setIsDeleteModalOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            size="medium"
                            variant="danger"
                            disabled={isDeleting}
                            onClick={handleDelete}
                        >
                            {isDeleting ? (
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