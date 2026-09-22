import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import { useParams } from "@tanstack/react-router";

import {
    getUserById,
    updateUserById,
} from "../../../services/authService";

import type {
    UserRole,
} from "../../../schemas/userSchema";

import { AppError } from "../../../errors/AppError";

import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import styles from "./EditUserDetails.module.css";

export default function EditUserDetails() {
    const { userId } = useParams({
        from: "/admin/users/$userId/edit",
    });

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] =
        useState<UserRole>("User");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isUpdating, setIsUpdating] =
        useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                setError("");
                setIsLoading(true);

                const user = await getUserById(
                    Number(userId)
                );

                setName(user.name);
                setEmail(user.email);
                setRole(user.role);
            } catch (error) {
                if (error instanceof AppError) {
                    setError(
                        error.detail ??
                        error.message
                    );
                } else {
                    setError(
                        "Unable to fetch user."
                    );
                }
            } finally {
                setIsLoading(false);
            }
        }

        loadUser();
    }, [userId]);

    async function handleUpdateUser(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setError("");
            setSuccess("");
            setIsUpdating(true);

            const updatedUser =
                await updateUserById(
                    Number(userId),
                    {
                        name: name.trim(),
                        email: email.trim(),
                        role,
                        ...(password && {
                            password,
                        }),
                    }
                );

            setName(updatedUser.name ?? "");
            setEmail(updatedUser.email ?? "");
            setRole(updatedUser.role as UserRole);

            setPassword("");

            setSuccess(
                "User updated successfully."
            );
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );
            } else {
                setError(
                    "Unable to update user."
                );
            }
        } finally {
            setIsUpdating(false);
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <LoadingWheel size="medium" />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            <Card variant="default">
                <h2>
                    Edit user details
                </h2>

                <form
                    className={styles.form}
                    onSubmit={handleUpdateUser}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="name">
                            Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">
                            New password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="role">
                            Role
                        </label>

                        <select
                            id="role"
                            name="role"
                            className={styles.select}
                            value={role}
                            onChange={(event) =>
                                setRole(
                                    event.target
                                        .value as UserRole
                                )
                            }
                        >
                            <option value="User">
                                User
                            </option>

                            <option value="Initiator">
                                Initiator
                            </option>

                            <option value="Attestant">
                                Attestant
                            </option>

                            <option value="Admin">
                                Admin
                            </option>
                        </select>
                    </div>

                    <Button
                        type="submit"
                        variant="square"
                        size="medium"
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <span
                                className={
                                    styles.updatingContent
                                }
                            >
                                Saving...
                                <LoadingWheel size="small" />
                            </span>
                        ) : (
                            "Save changes"
                        )}
                    </Button>
                </form>

                {success && (
                    <p
                        className={styles.success}
                        role="status"
                    >
                        {success}
                    </p>
                )}

                {error && (
                    <p
                        className={styles.error}
                        role="alert"
                    >
                        {error}
                    </p>
                )}
            </Card>
        </div>
    );
}