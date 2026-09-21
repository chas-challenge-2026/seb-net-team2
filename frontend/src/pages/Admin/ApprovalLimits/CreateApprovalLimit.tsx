import {
    useState,
    type FormEvent,
} from "react";

import { Link } from "@tanstack/react-router";

import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import { createApprovalLimit } from "../../../services/approvalLimitsService";

import { createApprovalLimitSchema } from "../../../schemas/approvalLimitsSchema";

import { AppError } from "../../../errors/AppError";

import styles from "./CreateApprovalLimit.module.css";

export default function CreateApprovalLimit() {
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

    const [isCreating, setIsCreating] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const result =
            createApprovalLimitSchema.safeParse({
                minAmount: Number(minAmount),
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

        setIsCreating(true);

        try {
            const createdLimit =
                await createApprovalLimit(
                    result.data
                );

            setSuccess(
                `Approval limit "${createdLimit.description}" was created successfully.`
            );

            setMinAmount("");
            setRequiredApprovals("");
            setDescription("");
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );

                return;
            }

            setError(
                "Unable to create approval limit."
            );
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className={styles.layout}>


            <header className={styles.pageHeader}>
                <h1>
                    Create approval limit
                </h1>

                <p>
                    Define when a payment requires
                    additional approvals.
                </p>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>
                        Approval rule
                    </h2>

                    <p>
                        Enter the minimum amount
                        and number of required
                        approvals.
                    </p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleSubmit}
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
                            disabled={isCreating}
                            onChange={(event) =>
                                setMinAmount(
                                    event.target.value
                                )
                            }
                            placeholder="50000"
                            required
                        />

                        <span
                            className={
                                styles.helperText
                            }
                        >
                            Payments from this
                            amount will use this
                            approval rule.
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
                            disabled={isCreating}
                            onChange={(event) =>
                                setRequiredApprovals(
                                    event.target.value
                                )
                            }
                            placeholder="2"
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
                            className={
                                styles.textarea
                            }
                            value={description}
                            disabled={isCreating}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Example: Payments above 50,000 require two approvals."
                            rows={4}
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
                            disabled={isCreating}
                            className={
                                styles.formButton
                            }
                        >
                            {isCreating ? (
                                <span
                                    className={
                                        styles.loadingButton
                                    }
                                >
                                    <LoadingWheel size="small" />

                                    Creating...
                                </span>
                            ) : (
                                "Create approval limit"
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}