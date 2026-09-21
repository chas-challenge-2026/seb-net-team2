import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import {
    Link,
    useParams,
} from "@tanstack/react-router";

import {
    getUserById,
    updateUserById,
} from "../../../services/authService";

import type {
    UserRole,
} from "../../../schemas/userSchema";

import { AppError } from "../../../errors/AppError";

import Button from "../../../components/Button/Button";
import PasswordInput from "../../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import styles from "./EditUserDetails.module.css";

export default function EditUserDetails() {
    const { userId } = useParams({
        from: "/admin/users/$userId/edit",
    });

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [role, setRole] =
        useState<UserRole>("User");

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isUpdating, setIsUpdating] =
        useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                setError("");
                setIsLoading(true);

                const user =
                    await getUserById(
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

        void loadUser();
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
            setRole(updatedUser.role ?? role);

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
            <div
                className={styles.loadingState}
                role="status"
                aria-live="polite"
            >
                <LoadingWheel size="medium" />
                <p>Loading user...</p>
            </div>
        );
    }

    return (
        <div className={styles.layout}>

            <header className={styles.pageHeader}>
                <h1>Edit user</h1>

                <p>
                    Update user information,
                    password or access role.
                </p>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>User information</h2>

                    <p>
                        Changes will be applied
                        to this user account.
                    </p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleUpdateUser}
                >
                    <div className={styles.formGroup}>
                        <label
                            htmlFor="name"
                            className={styles.label}
                        >
                            Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            className={styles.input}
                            value={name}
                            disabled={isUpdating}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="email"
                            className={styles.label}
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={styles.input}
                            value={email}
                            disabled={isUpdating}
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="password"
                            className={styles.label}
                        >
                            New password
                        </label>

                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            disabled={isUpdating}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
                            placeholder="Leave blank to keep current password"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="role"
                            className={styles.label}
                        >
                            Role
                        </label>

                        <select
                            id="role"
                            name="role"
                            className={styles.select}
                            value={role}
                            disabled={isUpdating}
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

                    {success && (
                        <div
                            className={styles.success}
                            role="status"
                        >
                            {success}
                        </div>
                    )}

                    {error && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Link
                            to="/admin/users/$userId"
                            params={{ userId }}
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
        </div>
    );
}