import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";

import Button from "../../../components/Button/Button";
import PasswordInput from "../../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import { useAuth } from "../../../hooks/useAuth";

import { createUser } from "../../../services/authService";

import { AppError } from "../../../errors/AppError";

import type { UserRole } from "../../../schemas/userSchema";

import styles from "./CreateUser.module.css";

export default function CreateUser() {
    const { user } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [role, setRole] =
        useState<UserRole>("User");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isCreating, setIsCreating] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) {
            setError(
                "Unable to determine the current user."
            );
            return;
        }

        setError("");
        setSuccess("");
        setIsCreating(true);

        try {
            const createdUser =
                await createUser({
                    tenantId: user.tenantId,
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role,
                });

            setSuccess(
                `${createdUser.name} was created successfully.`
            );

            setName("");
            setEmail("");
            setPassword("");
            setRole("User");
        } catch (error) {
            if (error instanceof AppError) {
                setError(
                    error.detail ??
                    error.message
                );

                return;
            }

            setError(
                "Unable to create user."
            );
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className={styles.layout}>

            <header className={styles.pageHeader}>
                <h1>Create user</h1>

                <p>
                    Add a new user and assign
                    their access role.
                </p>
            </header>

            <section className={styles.formSection}>
                <div className={styles.sectionHeader}>
                    <h2>User information</h2>

                    <p>
                        Enter the user's details
                        and select their role.
                    </p>
                </div>

                <form
                    className={styles.form}
                    onSubmit={handleSubmit}
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
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            autoComplete="name"
                            disabled={isCreating}
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
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            autoComplete="email"
                            inputMode="email"
                            disabled={isCreating}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label
                            htmlFor="password"
                            className={styles.label}
                        >
                            Password
                        </label>

                        <PasswordInput
                            id="password"
                            name="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
                            disabled={isCreating}
                            required
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
                            disabled={isCreating}
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
                            to="/admin/users"
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
                            className={
                                styles.formButton
                            }
                            disabled={isCreating}
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
                                "Create user"
                            )}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}