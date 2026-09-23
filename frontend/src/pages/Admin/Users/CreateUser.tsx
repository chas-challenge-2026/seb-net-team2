import { useState } from "react";
import type { FormEvent } from "react";

import { Link } from "@tanstack/react-router";

import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import Button from "../../../components/Button/Button";
import PasswordInput from "../../../components/PasswordInput/PasswordInput";
import LoadingWheel from "../../../components/LoadingState/LoadingWheel";

import { useAuth } from "../../../hooks/useAuth";

import { createUser } from "../../../services/authService";

import { AppError } from "../../../errors/AppError";

import type { UserRole } from "../../../schemas/userSchema";

import styles from "./CreateUser.module.css";

function getErrorMessage(error: unknown) {
    if (error instanceof AppError) {
        return error.detail ?? error.message;
    }

    return "Unable to create user.";
}

export default function CreateUser() {
    const { user } = useAuth();

    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [role, setRole] =
        useState<UserRole>("User");

    const createMutation = useMutation({
        mutationFn: createUser,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["users"],
            });

            setName("");
            setEmail("");
            setPassword("");
            setRole("User");
        },
    });

    function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) {
            return;
        }

        createMutation.mutate({
            tenantId: user.tenantId,
            name: name.trim(),
            email: email.trim(),
            password,
            role,
        });
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
                            disabled={
                                createMutation.isPending
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
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            autoComplete="email"
                            inputMode="email"
                            disabled={
                                createMutation.isPending
                            }
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
                            disabled={
                                createMutation.isPending
                            }
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
                            disabled={
                                createMutation.isPending
                            }
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

                    {createMutation.isSuccess && (
                        <div
                            className={styles.success}
                            role="status"
                        >
                            {
                                createMutation.data
                                    .name
                            }{" "}
                            was created successfully.
                        </div>
                    )}

                    {createMutation.isError && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            {getErrorMessage(
                                createMutation.error
                            )}
                        </div>
                    )}

                    {!user && (
                        <div
                            className={styles.error}
                            role="alert"
                        >
                            Unable to determine
                            the current user.
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
                            disabled={
                                createMutation.isPending ||
                                !user
                            }
                        >
                            {createMutation.isPending ? (
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